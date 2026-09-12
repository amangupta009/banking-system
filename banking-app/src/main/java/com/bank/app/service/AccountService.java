package com.bank.app.service;

import com.bank.app.dto.*;

import java.math.BigDecimal;
import java.util.List;

public interface AccountService {

    AccountResponse openAccount(OpenAccountRequest request);

    BalanceResponse getBalance(String accountNumber);

    AccountResponse deposit(String accountNumber, BigDecimal amount, String description);

    AccountResponse withdraw(String accountNumber, BigDecimal amount, String description);

    TransactionResponse transferFunds(TransferRequest request);

    List<TransactionResponse> getMiniStatement(String accountNumber);

    List<AccountResponse> getAllAccounts();

    AccountResponse getAccountDetails(String accountNumber);

    InterestCalculationResult calculateAndApplySavingsInterest(Double customAnnualRate);
}
