package com.bank.app.model;

import java.math.BigDecimal;
import java.time.Instant;

public class LoanRepayment {
    private String repaymentId;
    private BigDecimal amount;
    private BigDecimal principalPortion;
    private BigDecimal interestPortion;
    private BigDecimal remainingBalance;
    private Instant timestamp;

    public LoanRepayment() {
    }

    public LoanRepayment(String repaymentId, BigDecimal amount, BigDecimal principalPortion,
                         BigDecimal interestPortion, BigDecimal remainingBalance, Instant timestamp) {
        this.repaymentId = repaymentId;
        this.amount = amount;
        this.principalPortion = principalPortion;
        this.interestPortion = interestPortion;
        this.remainingBalance = remainingBalance;
        this.timestamp = timestamp;
    }

    public String getRepaymentId() {
        return repaymentId;
    }

    public void setRepaymentId(String repaymentId) {
        this.repaymentId = repaymentId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getPrincipalPortion() {
        return principalPortion;
    }

    public void setPrincipalPortion(BigDecimal principalPortion) {
        this.principalPortion = principalPortion;
    }

    public BigDecimal getInterestPortion() {
        return interestPortion;
    }

    public void setInterestPortion(BigDecimal interestPortion) {
        this.interestPortion = interestPortion;
    }

    public BigDecimal getRemainingBalance() {
        return remainingBalance;
    }

    public void setRemainingBalance(BigDecimal remainingBalance) {
        this.remainingBalance = remainingBalance;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
