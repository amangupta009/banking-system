package com.bank.app.controller;

import com.bank.app.dto.*;
import com.bank.app.service.LoanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/loans")
@Tag(name = "Loan Management", description = "Endpoints for loan application, approval, disbursement, and repayment tracking")
public class LoanController {

    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    @PostMapping("/apply")
    @Operation(summary = "7a. Apply for Loan", description = "Submit a new loan application for an existing bank account.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Loan application submitted"),
            @ApiResponse(responseCode = "400", description = "Invalid loan request"),
            @ApiResponse(responseCode = "404", description = "Account not found")
    })
    public ResponseEntity<LoanResponse> applyForLoan(@Valid @RequestBody ApplyLoanRequest request) {
        LoanResponse response = loanService.applyForLoan(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{loanId}/review")
    @Operation(summary = "7b. Approve or Reject Loan (Admin)", description = "Admin action to approve or reject a pending loan application.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Loan status updated"),
            @ApiResponse(responseCode = "404", description = "Loan not found"),
            @ApiResponse(responseCode = "409", description = "Loan is not in PENDING status")
    })
    public ResponseEntity<LoanResponse> reviewLoan(
            @Parameter(description = "Loan ID") @PathVariable String loanId,
            @Valid @RequestBody ReviewLoanRequest request) {
        LoanResponse response = loanService.reviewLoan(loanId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{loanId}/disburse")
    @Operation(summary = "7c. Disburse Loan", description = "Disburse approved loan principal to the borrower's account balance and activate loan. Prevents double disbursement.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Loan disbursed and balance updated"),
            @ApiResponse(responseCode = "404", description = "Loan or account not found"),
            @ApiResponse(responseCode = "409", description = "Loan cannot be disbursed (must be APPROVED, prevents double disbursement)")
    })
    public ResponseEntity<LoanResponse> disburseLoan(
            @Parameter(description = "Loan ID") @PathVariable String loanId) {
        LoanResponse response = loanService.disburseLoan(loanId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{loanId}/repay")
    @Operation(summary = "7d. Repay Loan Installment", description = "Make a loan repayment using reducing balance method. Debits borrower account and reduces outstanding balance.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Repayment recorded"),
            @ApiResponse(responseCode = "404", description = "Loan or account not found"),
            @ApiResponse(responseCode = "409", description = "Insufficient funds in borrower account or loan not ACTIVE")
    })
    public ResponseEntity<LoanResponse> repayLoan(
            @Parameter(description = "Loan ID") @PathVariable String loanId,
            @Valid @RequestBody RepayLoanRequest request) {
        LoanResponse response = loanService.repayLoan(loanId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{loanId}")
    @Operation(summary = "Get Loan by ID", description = "Fetch complete loan details, schedule, and repayment history.")
    public ResponseEntity<LoanResponse> getLoanById(
            @Parameter(description = "Loan ID") @PathVariable String loanId) {
        LoanResponse response = loanService.getLoanById(loanId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/account/{accountNumber}")
    @Operation(summary = "Get Loans for Account", description = "Fetch all loan applications and active loans associated with an account.")
    public ResponseEntity<List<LoanResponse>> getLoansByAccount(
            @Parameter(description = "Account number") @PathVariable String accountNumber) {
        List<LoanResponse> loans = loanService.getLoansByAccount(accountNumber);
        return ResponseEntity.ok(loans);
    }

    @GetMapping
    @Operation(summary = "List All Loans", description = "Retrieve all loans in the banking system.")
    public ResponseEntity<List<LoanResponse>> getAllLoans() {
        List<LoanResponse> loans = loanService.getAllLoans();
        return ResponseEntity.ok(loans);
    }

    @PostMapping("/calculate-loan-interest")
    @Operation(summary = "8b. Compute & Apply Active Loans Interest", description = "Compute monthly reducing balance interest on all active loans.")
    public ResponseEntity<InterestCalculationResult> calculateActiveLoansInterest() {
        InterestCalculationResult result = loanService.calculateAndApplyActiveLoansInterest();
        return ResponseEntity.ok(result);
    }
}
