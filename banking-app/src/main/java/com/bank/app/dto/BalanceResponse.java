package com.bank.app.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class BalanceResponse {

    private String accountNumber;
    private String holderName;
    private BigDecimal currentBalance;
    private Instant asOf;

    public BalanceResponse() {
    }

    public BalanceResponse(String accountNumber, String holderName, BigDecimal currentBalance, Instant asOf) {
        this.accountNumber = accountNumber;
        this.holderName = holderName;
        this.currentBalance = currentBalance;
        this.asOf = asOf;
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

    public BigDecimal getCurrentBalance() {
        return currentBalance;
    }

    public void setCurrentBalance(BigDecimal currentBalance) {
        this.currentBalance = currentBalance;
    }

    public Instant getAsOf() {
        return asOf;
    }

    public void setAsOf(Instant asOf) {
        this.asOf = asOf;
    }
}
