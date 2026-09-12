package com.bank.app.dto;

import com.bank.app.model.LoanRepayment;
import com.bank.app.model.LoanStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class LoanResponse {

    private String loanId;
    private String accountNumber;
    private BigDecimal principal;
    private BigDecimal interestRate;
    private Integer tenureMonths;
    private LoanStatus status;
    private Instant createdAt;
    private Instant approvedAt;
    private Instant disbursedAt;
    private BigDecimal outstandingBalance;
    private List<LoanRepayment> repaymentHistory;

    public LoanResponse() {
    }

    public LoanResponse(String loanId, String accountNumber, BigDecimal principal, BigDecimal interestRate,
                        Integer tenureMonths, LoanStatus status, Instant createdAt, Instant approvedAt,
                        Instant disbursedAt, BigDecimal outstandingBalance, List<LoanRepayment> repaymentHistory) {
        this.loanId = loanId;
        this.accountNumber = accountNumber;
        this.principal = principal;
        this.interestRate = interestRate;
        this.tenureMonths = tenureMonths;
        this.status = status;
        this.createdAt = createdAt;
        this.approvedAt = approvedAt;
        this.disbursedAt = disbursedAt;
        this.outstandingBalance = outstandingBalance;
        this.repaymentHistory = repaymentHistory;
    }

    public String getLoanId() {
        return loanId;
    }

    public void setLoanId(String loanId) {
        this.loanId = loanId;
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

    public BigDecimal getInterestRate() {
        return interestRate;
    }

    public void setInterestRate(BigDecimal interestRate) {
        this.interestRate = interestRate;
    }

    public Integer getTenureMonths() {
        return tenureMonths;
    }

    public void setTenureMonths(Integer tenureMonths) {
        this.tenureMonths = tenureMonths;
    }

    public LoanStatus getStatus() {
        return status;
    }

    public void setStatus(LoanStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(Instant approvedAt) {
        this.approvedAt = approvedAt;
    }

    public Instant getDisbursedAt() {
        return disbursedAt;
    }

    public void setDisbursedAt(Instant disbursedAt) {
        this.disbursedAt = disbursedAt;
    }

    public BigDecimal getOutstandingBalance() {
        return outstandingBalance;
    }

    public void setOutstandingBalance(BigDecimal outstandingBalance) {
        this.outstandingBalance = outstandingBalance;
    }

    public List<LoanRepayment> getRepaymentHistory() {
        return repaymentHistory;
    }

    public void setRepaymentHistory(List<LoanRepayment> repaymentHistory) {
        this.repaymentHistory = repaymentHistory;
    }
}
