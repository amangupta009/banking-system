package com.bank.app.dto;

import jakarta.validation.constraints.NotNull;

public class ReviewLoanRequest {

    @NotNull(message = "Approval status must be specified (true for approve, false for reject)")
    private Boolean approve;

    private String remarks;

    public ReviewLoanRequest() {
    }

    public ReviewLoanRequest(Boolean approve, String remarks) {
        this.approve = approve;
        this.remarks = remarks;
    }

    public Boolean getApprove() {
        return approve;
    }

    public void setApprove(Boolean approve) {
        this.approve = approve;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
