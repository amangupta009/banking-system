package com.bank.app.service;

import com.bank.app.dto.*;
import com.bank.app.exception.InsufficientBalanceException;
import com.bank.app.exception.LoanProcessingException;
import com.bank.app.exception.ResourceNotFoundException;
import com.bank.app.model.*;
import com.bank.app.repository.AccountRepository;
import com.bank.app.repository.LoanRepository;
import com.bank.app.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LoanServiceImpl implements LoanService {

    private final LoanRepository loanRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${bank.interest.loan-annual-rate:0.085}")
    private BigDecimal defaultLoanAnnualRate;

    public LoanServiceImpl(LoanRepository loanRepository,
                           AccountRepository accountRepository,
                           TransactionRepository transactionRepository) {
        this.loanRepository = loanRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public LoanResponse applyForLoan(ApplyLoanRequest request) {
        String accountNumber = request.getAccountNumber().trim();

        // Validate account exists
        if (!accountRepository.existsByAccountNumber(accountNumber)) {
            throw new ResourceNotFoundException("Account not found with account number: " + accountNumber);
        }

        BigDecimal rate = request.getInterestRate() != null && request.getInterestRate().compareTo(BigDecimal.ZERO) > 0
                ? request.getInterestRate()
                : defaultLoanAnnualRate;

        BigDecimal principal = request.getPrincipal().setScale(2, RoundingMode.HALF_UP);
        String loanId = "LN-" + System.currentTimeMillis() + "-" + (1000 + secureRandom.nextInt(9000));

        Loan loan = new Loan(
                loanId,
                accountNumber,
                principal,
                rate,
                request.getTenureMonths(),
                LoanStatus.PENDING,
                Instant.now(),
                principal
        );

        Loan savedLoan = loanRepository.save(loan);
        return mapToLoanResponse(savedLoan);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public LoanResponse reviewLoan(String loanId, ReviewLoanRequest request) {
        Loan loan = getLoanEntity(loanId);

        if (loan.getStatus() != LoanStatus.PENDING) {
            throw new LoanProcessingException(
                    String.format("Cannot review loan %s. Only PENDING loans can be reviewed. Current status is %s.",
                            loanId, loan.getStatus())
            );
        }

        if (Boolean.TRUE.equals(request.getApprove())) {
            loan.setStatus(LoanStatus.APPROVED);
            loan.setApprovedAt(Instant.now());
        } else {
            loan.setStatus(LoanStatus.REJECTED);
        }

        Loan updatedLoan = loanRepository.save(loan);
        return mapToLoanResponse(updatedLoan);
    }

    /**
     * Disburse an approved loan:
     * 1. Verifies loan status is APPROVED (prevents double disbursement)
     * 2. Sets status to ACTIVE, sets disbursedAt timestamp, outstanding balance = principal
     * 3. Atomically credits the loan principal amount to the borrower's account
     * 4. Logs a LOAN_DISBURSEMENT transaction
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public LoanResponse disburseLoan(String loanId) {
        Loan loan = getLoanEntity(loanId);

        // Prevent double disbursement
        if (loan.getStatus() != LoanStatus.APPROVED) {
            throw new LoanProcessingException(
                    String.format("Loan %s cannot be disbursed. Expected status APPROVED, but current status is %s.",
                            loanId, loan.getStatus())
            );
        }

        Account account = accountRepository.findByAccountNumber(loan.getAccountNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Borrower account not found: " + loan.getAccountNumber()));

        Instant now = Instant.now();
        loan.setStatus(LoanStatus.ACTIVE);
        loan.setDisbursedAt(now);
        loan.setOutstandingBalance(loan.getPrincipal());

        // Credit to borrower's account
        BigDecimal newAccountBalance = account.getBalance().add(loan.getPrincipal()).setScale(2, RoundingMode.HALF_UP);
        account.setBalance(newAccountBalance);
        accountRepository.save(account);

        // Record disbursement transaction
        Transaction txn = new Transaction(
                "TXN-DISB-" + System.currentTimeMillis(),
                loan.getAccountNumber(),
                TransactionType.LOAN_DISBURSEMENT,
                loan.getPrincipal(),
                newAccountBalance,
                now,
                loanId,
                String.format("Loan disbursement for loan %s", loanId)
        );
        transactionRepository.save(txn);

        Loan updatedLoan = loanRepository.save(loan);
        return mapToLoanResponse(updatedLoan);
    }

    /**
     * Repay loan using reducing balance method:
     * 1. Computes monthly interest on outstanding balance: interestPortion = outstandingBalance * (annualRate / 12)
     * 2. principalPortion = repaymentAmount - interestPortion
     * 3. outstandingBalance = outstandingBalance - principalPortion
     * 4. If outstandingBalance <= 0, mark loan as CLOSED
     * 5. Atomically debits the borrower's account if funds exist, and records repayment transaction
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public LoanResponse repayLoan(String loanId, RepayLoanRequest request) {
        Loan loan = getLoanEntity(loanId);

        if (loan.getStatus() != LoanStatus.ACTIVE) {
            throw new LoanProcessingException(
                    String.format("Cannot repay loan %s. Status is %s (must be ACTIVE).", loanId, loan.getStatus())
            );
        }

        BigDecimal repaymentAmount = request.getAmount().setScale(2, RoundingMode.HALF_UP);
        if (repaymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new LoanProcessingException("Repayment amount must be strictly greater than zero");
        }

        Account account = accountRepository.findByAccountNumber(loan.getAccountNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Borrower account not found: " + loan.getAccountNumber()));

        if (account.getBalance().compareTo(repaymentAmount) < 0) {
            throw new InsufficientBalanceException(
                    String.format("Cannot process repayment: Insufficient balance in account %s. Balance: %s, Repayment: %s",
                            account.getAccountNumber(), account.getBalance(), repaymentAmount)
            );
        }

        // Debit the account
        BigDecimal newAccBal = account.getBalance().subtract(repaymentAmount).setScale(2, RoundingMode.HALF_UP);
        account.setBalance(newAccBal);
        accountRepository.save(account);

        // Reducing balance interest computation:
        // Monthly interest portion = outstandingBalance * (annualRate / 12)
        BigDecimal monthlyRate = loan.getInterestRate().divide(BigDecimal.valueOf(12), 8, RoundingMode.HALF_UP);
        BigDecimal interestPortion = loan.getOutstandingBalance().multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);

        BigDecimal principalPortion;
        if (repaymentAmount.compareTo(interestPortion) >= 0) {
            principalPortion = repaymentAmount.subtract(interestPortion);
        } else {
            // Repayment did not even cover interest
            interestPortion = repaymentAmount;
            principalPortion = BigDecimal.ZERO;
        }

        BigDecimal newRemaining = loan.getOutstandingBalance().subtract(principalPortion).setScale(2, RoundingMode.HALF_UP);
        if (newRemaining.compareTo(BigDecimal.ZERO) <= 0) {
            newRemaining = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
            loan.setStatus(LoanStatus.CLOSED);
        }
        loan.setOutstandingBalance(newRemaining);

        Instant now = Instant.now();
        String repaymentId = "REP-" + System.currentTimeMillis();
        LoanRepayment repaymentRecord = new LoanRepayment(
                repaymentId,
                repaymentAmount,
                principalPortion,
                interestPortion,
                newRemaining,
                now
        );
        loan.getRepaymentHistory().add(repaymentRecord);

        // Record transaction
        Transaction txn = new Transaction(
                "TXN-REP-" + System.currentTimeMillis(),
                loan.getAccountNumber(),
                TransactionType.LOAN_REPAYMENT,
                repaymentAmount,
                newAccBal,
                now,
                loanId,
                String.format("Repayment for loan %s: Principal=%s, Interest=%s, Remaining=%s",
                        loanId, principalPortion, interestPortion, newRemaining)
        );
        transactionRepository.save(txn);

        Loan updatedLoan = loanRepository.save(loan);
        return mapToLoanResponse(updatedLoan);
    }

    @Override
    public LoanResponse getLoanById(String loanId) {
        return mapToLoanResponse(getLoanEntity(loanId));
    }

    @Override
    public List<LoanResponse> getLoansByAccount(String accountNumber) {
        return loanRepository.findByAccountNumber(accountNumber).stream()
                .map(this::mapToLoanResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<LoanResponse> getAllLoans() {
        return loanRepository.findAll().stream()
                .map(this::mapToLoanResponse)
                .collect(Collectors.toList());
    }

    /**
     * Compute and apply monthly reducing balance interest on all active loans.
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public InterestCalculationResult calculateAndApplyActiveLoansInterest() {
        List<Loan> activeLoans = loanRepository.findByStatus(LoanStatus.ACTIVE);
        List<String> details = new ArrayList<>();
        BigDecimal totalInterest = BigDecimal.ZERO;
        Instant now = Instant.now();

        for (Loan loan : activeLoans) {
            if (loan.getOutstandingBalance().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal monthlyRate = loan.getInterestRate().divide(BigDecimal.valueOf(12), 8, RoundingMode.HALF_UP);
                BigDecimal accruedInterest = loan.getOutstandingBalance().multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);

                BigDecimal newOutstanding = loan.getOutstandingBalance().add(accruedInterest).setScale(2, RoundingMode.HALF_UP);
                loan.setOutstandingBalance(newOutstanding);
                loanRepository.save(loan);

                totalInterest = totalInterest.add(accruedInterest);
                details.add(String.format("Loan %s (Account %s): Accrued interest %s added. New outstanding balance: %s",
                        loan.getLoanId(), loan.getAccountNumber(), accruedInterest, newOutstanding));
            }
        }

        return new InterestCalculationResult(
                "ACTIVE_LOANS_REDUCING_BALANCE_INTEREST",
                activeLoans.size(),
                totalInterest.setScale(2, RoundingMode.HALF_UP),
                now,
                details
        );
    }

    private Loan getLoanEntity(String loanId) {
        return loanRepository.findByLoanId(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with ID: " + loanId));
    }

    private LoanResponse mapToLoanResponse(Loan loan) {
        return new LoanResponse(
                loan.getLoanId(),
                loan.getAccountNumber(),
                loan.getPrincipal(),
                loan.getInterestRate(),
                loan.getTenureMonths(),
                loan.getStatus(),
                loan.getCreatedAt(),
                loan.getApprovedAt(),
                loan.getDisbursedAt(),
                loan.getOutstandingBalance(),
                loan.getRepaymentHistory()
        );
    }
}
