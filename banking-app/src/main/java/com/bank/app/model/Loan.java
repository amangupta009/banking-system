package com.bank.app.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "loans")
public class Loan {

    @Id
    private String id;

    @Indexed(unique = true)
    private String loanId;

    @Indexed
    private String accountNumber;

    private BigDecimal principal;

    private BigDecimal interestRate;

    private Integer tenureMonths;

    @Indexed
    private LoanStatus status;

    private Instant createdAt;

    private Instant approvedAt;

    private Instant disbursedAt;

    private BigDecimal outstandingBalance;

    private List<LoanRepayment> repaymentHistory = new ArrayList<>();

    public Loan() {
    }

    public Loan(String loanId, String accountNumber, BigDecimal principal, BigDecimal interestRate,
                Integer tenureMonths, LoanStatus status, Instant createdAt, BigDecimal outstandingBalance) {
        this.loanId = loanId;
        this.accountNumber = accountNumber;
        this.principal = principal;
        this.interestRate = interestRate;
        this.tenureMonths = tenureMonths;
        this.status = status;
        this.createdAt = createdAt;
        this.outstandingBalance = outstandingBalance;
        this.repaymentHistory = new ArrayList<>();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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
