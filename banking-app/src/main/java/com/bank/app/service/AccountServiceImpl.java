package com.bank.app.service;

import com.bank.app.dto.*;
import com.bank.app.exception.InsufficientBalanceException;
import com.bank.app.exception.InvalidTransactionException;
import com.bank.app.exception.ResourceNotFoundException;
import com.bank.app.model.Account;
import com.bank.app.model.AccountType;
import com.bank.app.model.Transaction;
import com.bank.app.model.TransactionType;
import com.bank.app.repository.AccountRepository;
import com.bank.app.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${bank.interest.savings-annual-rate:0.04}")
    private BigDecimal defaultSavingsInterestRate;

    public AccountServiceImpl(AccountRepository accountRepository,
                              TransactionRepository transactionRepository,
                              PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AccountResponse openAccount(OpenAccountRequest request) {
        if (request.getInitialDeposit() == null || request.getInitialDeposit().compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidTransactionException("Initial deposit cannot be negative");
        }

        String accountNumber = generateUniqueAccountNumber();
        BigDecimal initialBalance = request.getInitialDeposit().setScale(2, RoundingMode.HALF_UP);
        Instant now = Instant.now();

        String passwordHash = null;
        if (request.getPin() != null && !request.getPin().trim().isEmpty()) {
            passwordHash = passwordEncoder.encode(request.getPin().trim());
        }

        BigDecimal interestRate = request.getAccountType() == AccountType.SAVINGS
                ? defaultSavingsInterestRate
                : BigDecimal.ZERO;

        Account account = new Account(
                accountNumber,
                request.getHolderName().trim(),
                request.getAccountType(),
                initialBalance,
                interestRate,
                passwordHash,
                now
        );

        Account savedAccount = accountRepository.save(account);

        // Record initial deposit transaction if amount > 0
        if (initialBalance.compareTo(BigDecimal.ZERO) > 0) {
            Transaction initialTxn = new Transaction(
                    generateTransactionId(),
                    accountNumber,
                    TransactionType.DEPOSIT,
                    initialBalance,
                    initialBalance,
                    now,
                    null,
                    "Initial account opening deposit"
            );
            transactionRepository.save(initialTxn);
        }

        return mapToAccountResponse(savedAccount);
    }

    @Override
    public BalanceResponse getBalance(String accountNumber) {
        Account account = getAccountEntity(accountNumber);
        return new BalanceResponse(
                account.getAccountNumber(),
                account.getHolderName(),
                account.getBalance(),
                Instant.now()
        );
    }

    @Override
    public AccountResponse getAccountDetails(String accountNumber) {
        Account account = getAccountEntity(accountNumber);
        return mapToAccountResponse(account);
    }

    @Override
    public List<AccountResponse> getAllAccounts() {
        return accountRepository.findAll().stream()
                .map(this::mapToAccountResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AccountResponse deposit(String accountNumber, BigDecimal amount, String description) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidTransactionException("Deposit amount must be strictly greater than zero");
        }

        Account account = getAccountEntity(accountNumber);
        BigDecimal normalizedAmount = amount.setScale(2, RoundingMode.HALF_UP);
        BigDecimal newBalance = account.getBalance().add(normalizedAmount).setScale(2, RoundingMode.HALF_UP);
        account.setBalance(newBalance);

        Account updatedAccount = accountRepository.save(account);

        Instant now = Instant.now();
        Transaction transaction = new Transaction(
                generateTransactionId(),
                accountNumber,
                TransactionType.DEPOSIT,
                normalizedAmount,
                newBalance,
                now,
                null,
                description != null ? description : "Cash/Cheque Deposit"
        );
        transactionRepository.save(transaction);

        return mapToAccountResponse(updatedAccount);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AccountResponse withdraw(String accountNumber, BigDecimal amount, String description) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidTransactionException("Withdrawal amount must be strictly greater than zero");
        }

        Account account = getAccountEntity(accountNumber);
        BigDecimal normalizedAmount = amount.setScale(2, RoundingMode.HALF_UP);

        // Crucial overdraft validation
        if (account.getBalance().compareTo(normalizedAmount) < 0) {
            throw new InsufficientBalanceException(
                    String.format("Withdrawal rejected: Insufficient funds in account %s. Current balance is %s, attempted withdrawal is %s",
                            accountNumber, account.getBalance(), normalizedAmount)
            );
        }

        BigDecimal newBalance = account.getBalance().subtract(normalizedAmount).setScale(2, RoundingMode.HALF_UP);
        account.setBalance(newBalance);

        Account updatedAccount = accountRepository.save(account);

        Instant now = Instant.now();
        Transaction transaction = new Transaction(
                generateTransactionId(),
                accountNumber,
                TransactionType.WITHDRAW,
                normalizedAmount,
                newBalance,
                now,
                null,
                description != null ? description : "Cash/ATM Withdrawal"
        );
        transactionRepository.save(transaction);

        return mapToAccountResponse(updatedAccount);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TransactionResponse transferFunds(TransferRequest request) {
        String fromAccNum = request.getFromAccountNumber().trim();
        String toAccNum = request.getToAccountNumber().trim();

        if (fromAccNum.equalsIgnoreCase(toAccNum)) {
            throw new InvalidTransactionException("Source and destination accounts cannot be the same");
        }

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidTransactionException("Transfer amount must be strictly positive");
        }

        BigDecimal transferAmount = request.getAmount().setScale(2, RoundingMode.HALF_UP);

        // Fetch source and destination accounts
        Account fromAccount = getAccountEntity(fromAccNum);
        Account toAccount = getAccountEntity(toAccNum);

        // Validate sufficient funds
        if (fromAccount.getBalance().compareTo(transferAmount) < 0) {
            throw new InsufficientBalanceException(
                    String.format("Transfer failed: Insufficient funds in sender account %s. Balance: %s, Required: %s",
                            fromAccNum, fromAccount.getBalance(), transferAmount)
            );
        }

        Instant now = Instant.now();
        String transferTxnId = generateTransactionId();

        // 1. Debit from source account
        BigDecimal newFromBalance = fromAccount.getBalance().subtract(transferAmount).setScale(2, RoundingMode.HALF_UP);
        fromAccount.setBalance(newFromBalance);
        accountRepository.save(fromAccount);

        Transaction debitTxn = new Transaction(
                transferTxnId + "-OUT",
                fromAccNum,
                TransactionType.TRANSFER_OUT,
                transferAmount,
                newFromBalance,
                now,
                toAccNum,
                request.getRemarks() != null ? request.getRemarks() : "Fund transfer to account " + toAccNum
        );
        transactionRepository.save(debitTxn);

        // 2. Credit to destination account
        BigDecimal newToBalance = toAccount.getBalance().add(transferAmount).setScale(2, RoundingMode.HALF_UP);
        toAccount.setBalance(newToBalance);
        accountRepository.save(toAccount);

        Transaction creditTxn = new Transaction(
                transferTxnId + "-IN",
                toAccNum,
                TransactionType.TRANSFER_IN,
                transferAmount,
                newToBalance,
                now,
                fromAccNum,
                request.getRemarks() != null ? request.getRemarks() : "Fund transfer from account " + fromAccNum
        );
        transactionRepository.save(creditTxn);

        return mapToTransactionResponse(debitTxn);
    }

    @Override
    public List<TransactionResponse> getMiniStatement(String accountNumber) {
        // Validate account exists
        if (!accountRepository.existsByAccountNumber(accountNumber)) {
            throw new ResourceNotFoundException("Account not found with account number: " + accountNumber);
        }

        List<Transaction> transactions = transactionRepository.findTop10ByAccountNumberOrderByTimestampDesc(accountNumber);
        return transactions.stream()
                .map(this::mapToTransactionResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InterestCalculationResult calculateAndApplySavingsInterest(Double customAnnualRate) {
        BigDecimal annualRate = customAnnualRate != null
                ? BigDecimal.valueOf(customAnnualRate)
                : defaultSavingsInterestRate;

        // Monthly simple interest factor: (annualRate / 12)
        BigDecimal monthlyRateFactor = annualRate.divide(BigDecimal.valueOf(12), 8, RoundingMode.HALF_UP);

        List<Account> savingsAccounts = accountRepository.findByAccountType(AccountType.SAVINGS);
        List<String> details = new ArrayList<>();
        BigDecimal totalInterest = BigDecimal.ZERO;
        Instant now = Instant.now();

        for (Account account : savingsAccounts) {
            BigDecimal currentBal = account.getBalance();
            if (currentBal.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal interestAmount = currentBal.multiply(monthlyRateFactor).setScale(2, RoundingMode.HALF_UP);
                if (interestAmount.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal newBal = currentBal.add(interestAmount).setScale(2, RoundingMode.HALF_UP);
                    account.setBalance(newBal);
                    accountRepository.save(account);

                    Transaction interestTxn = new Transaction(
                            generateTransactionId(),
                            account.getAccountNumber(),
                            TransactionType.INTEREST_CREDIT,
                            interestAmount,
                            newBal,
                            now,
                            null,
                            String.format("Monthly savings interest credit (Annual Rate: %.2f%%)", annualRate.multiply(BigDecimal.valueOf(100)))
                    );
                    transactionRepository.save(interestTxn);

                    totalInterest = totalInterest.add(interestAmount);
                    details.add(String.format("Account %s: Credited interest %s (New balance: %s)",
                            account.getAccountNumber(), interestAmount, newBal));
                }
            }
        }

        return new InterestCalculationResult(
                "SAVINGS_MONTHLY_INTEREST",
                savingsAccounts.size(),
                totalInterest.setScale(2, RoundingMode.HALF_UP),
                now,
                details
        );
    }

    private Account getAccountEntity(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with account number: " + accountNumber));
    }

    private synchronized String generateUniqueAccountNumber() {
        String accountNumber;
        int candidate = 1001;
        do {
            accountNumber = String.valueOf(candidate);
            candidate++;
        } while (accountRepository.existsByAccountNumber(accountNumber));
        return accountNumber;
    }

    private String generateTransactionId() {
        return "TXN-" + System.currentTimeMillis() + "-" + (1000 + secureRandom.nextInt(9000));
    }

    private AccountResponse mapToAccountResponse(Account account) {
        return new AccountResponse(
                account.getAccountNumber(),
                account.getHolderName(),
                account.getAccountType(),
                account.getBalance(),
                account.getInterestRate(),
                account.getCreatedAt()
        );
    }

    private TransactionResponse mapToTransactionResponse(Transaction transaction) {
        return new TransactionResponse(
                transaction.getTransactionId(),
                transaction.getAccountNumber(),
                transaction.getType(),
                transaction.getAmount(),
                transaction.getBalanceAfter(),
                transaction.getTimestamp(),
                transaction.getRelatedAccount(),
                transaction.getDescription()
        );
    }
}
