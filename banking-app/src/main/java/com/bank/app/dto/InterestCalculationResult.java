package com.bank.app.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class InterestCalculationResult {

    private String calculationType;
    private int accountsOrLoansProcessed;
    private BigDecimal totalInterestCalculated;
    private Instant processedAt;
    private List<String> details;

    public InterestCalculationResult() {
    }

    public InterestCalculationResult(String calculationType, int accountsOrLoansProcessed,
                                     BigDecimal totalInterestCalculated, Instant processedAt, List<String> details) {
        this.calculationType = calculationType;
        this.accountsOrLoansProcessed = accountsOrLoansProcessed;
        this.totalInterestCalculated = totalInterestCalculated;
        this.processedAt = processedAt;
        this.details = details;
    }

    public String getCalculationType() {
        return calculationType;
    }

    public void setCalculationType(String calculationType) {
        this.calculationType = calculationType;
    }

    public int getAccountsOrLoansProcessed() {
        return accountsOrLoansProcessed;
    }

    public void setAccountsOrLoansProcessed(int accountsOrLoansProcessed) {
        this.accountsOrLoansProcessed = accountsOrLoansProcessed;
    }

    public BigDecimal getTotalInterestCalculated() {
        return totalInterestCalculated;
    }

    public void setTotalInterestCalculated(BigDecimal totalInterestCalculated) {
        this.totalInterestCalculated = totalInterestCalculated;
    }

    public Instant getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(Instant processedAt) {
        this.processedAt = processedAt;
    }

    public List<String> getDetails() {
        return details;
    }

    public void setDetails(List<String> details) {
        this.details = details;
    }
}
