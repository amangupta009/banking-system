package com.bank.app.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class ApplyLoanRequest {

    @NotBlank(message = "Account number is required")
    private String accountNumber;

    @NotNull(message = "Loan principal amount is required")
    @DecimalMin(value = "100.00", message = "Minimum loan principal is 100.00")
    private BigDecimal principal;

    @NotNull(message = "Loan tenure in months is required")
    @Min(value = 1, message = "Tenure must be at least 1 month")
    private Integer tenureMonths;

    /**
     * Optional custom interest rate; if null, bank standard default rate is used.
     */
    private BigDecimal interestRate;

    public ApplyLoanRequest() {
    }

    public ApplyLoanRequest(String accountNumber, BigDecimal principal, Integer tenureMonths, BigDecimal interestRate) {
        this.accountNumber = accountNumber;
        this.principal = principal;
        this.tenureMonths = tenureMonths;
        this.interestRate = interestRate;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public BigDecimal getPrincipal() {
        return principal;
    }

    public void setPrincipal(BigDecimal principal) {
        this.principal = principal;
    }

    public Integer getTenureMonths() {
        return tenureMonths;
    }

    public void setTenureMonths(Integer tenureMonths) {
        this.tenureMonths = tenureMonths;
    }

    public BigDecimal getInterestRate() {
        return interestRate;
    }

    public void setInterestRate(BigDecimal interestRate) {
        this.interestRate = interestRate;
    }
}
