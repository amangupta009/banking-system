package com.bank.app.service;

import com.bank.app.dto.*;

import java.math.BigDecimal;
import java.util.List;

public interface LoanService {

    LoanResponse applyForLoan(ApplyLoanRequest request);

    LoanResponse reviewLoan(String loanId, ReviewLoanRequest request);

    LoanResponse disburseLoan(String loanId);

    LoanResponse repayLoan(String loanId, RepayLoanRequest request);

    LoanResponse getLoanById(String loanId);

    List<LoanResponse> getLoansByAccount(String accountNumber);

    List<LoanResponse> getAllLoans();

    InterestCalculationResult calculateAndApplyActiveLoansInterest();
}
