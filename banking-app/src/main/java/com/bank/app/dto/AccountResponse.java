package com.bank.app.dto;

import com.bank.app.model.AccountType;

import java.math.BigDecimal;
import java.time.Instant;

public class AccountResponse {

    private String accountNumber;
    private String holderName;
    private AccountType accountType;
    private BigDecimal balance;
    private BigDecimal interestRate;
    private Instant createdAt;

    public AccountResponse() {
    }

    public AccountResponse(String accountNumber, String holderName, AccountType accountType,
                           BigDecimal balance, BigDecimal interestRate, Instant createdAt) {
        this.accountNumber = accountNumber;
        this.holderName = holderName;
        this.accountType = accountType;
        this.balance = balance;
        this.interestRate = interestRate;
        this.createdAt = createdAt;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getHolderName() {
        return holderName;
    }

    public void setHolderName(String holderName) {
        this.holderName = holderName;
    }

    public AccountType getAccountType() {
        return accountType;
    }

    public void setAccountType(AccountType accountType) {
        this.accountType = accountType;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public BigDecimal getInterestRate() {
        return interestRate;
    }

    public void setInterestRate(BigDecimal interestRate) {
        this.interestRate = interestRate;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
