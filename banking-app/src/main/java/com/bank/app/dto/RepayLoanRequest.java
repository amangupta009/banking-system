package com.bank.app.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class RepayLoanRequest {

    @NotNull(message = "Repayment amount is required")
    @DecimalMin(value = "0.01", message = "Repayment amount must be positive")
    private BigDecimal amount;

    public RepayLoanRequest() {
    }

    public RepayLoanRequest(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
