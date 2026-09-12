package com.bank.app.controller;

import com.bank.app.dto.*;
import com.bank.app.service.AccountService;
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
@RequestMapping("/api/v1/accounts")
@Tag(name = "Account Management", description = "Endpoints for creating accounts, deposit, withdraw, transfer, and statements")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    @Operation(summary = "1. Open Bank Account", description = "Create a new bank account (SAVINGS or CURRENT) with initial deposit and auto-generated unique account number.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Account opened successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input payload")
    })
    public ResponseEntity<AccountResponse> openAccount(@Valid @RequestBody OpenAccountRequest request) {
        AccountResponse response = accountService.openAccount(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "List All Accounts", description = "Retrieve all bank accounts in the banking system.")
    public ResponseEntity<List<AccountResponse>> getAllAccounts() {
        List<AccountResponse> response = accountService.getAllAccounts();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{accountNumber}/balance")
    @Operation(summary = "5. Balance Enquiry", description = "Fetch real-time available balance for a given account number.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Balance fetched successfully"),
            @ApiResponse(responseCode = "404", description = "Account not found")
    })
    public ResponseEntity<BalanceResponse> getBalance(
            @Parameter(description = "Account number") @PathVariable String accountNumber) {
        BalanceResponse response = accountService.getBalance(accountNumber);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{accountNumber}")
    @Operation(summary = "Get Account Details", description = "Fetch complete account details including holder name, type, and balance.")
    public ResponseEntity<AccountResponse> getAccount(
            @Parameter(description = "Account number") @PathVariable String accountNumber) {
        AccountResponse response = accountService.getAccountDetails(accountNumber);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{accountNumber}/deposit")
    @Operation(summary = "2. Deposit Funds", description = "Deposit funds into an existing bank account. Validates positive amount and logs transaction.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Deposit successful"),
            @ApiResponse(responseCode = "400", description = "Invalid deposit amount"),
            @ApiResponse(responseCode = "404", description = "Account not found")
    })
    public ResponseEntity<AccountResponse> deposit(
            @Parameter(description = "Account number") @PathVariable String accountNumber,
            @Valid @RequestBody DepositRequest request) {
        AccountResponse response = accountService.deposit(accountNumber, request.getAmount(), request.getDescription());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{accountNumber}/withdraw")
    @Operation(summary = "3. Withdraw Funds", description = "Withdraw funds from an account. Rejects overdrafts with 409 Conflict.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Withdrawal successful"),
            @ApiResponse(responseCode = "400", description = "Invalid withdrawal amount"),
            @ApiResponse(responseCode = "404", description = "Account not found"),
            @ApiResponse(responseCode = "409", description = "Insufficient balance (overdraft rejected)")
    })
    public ResponseEntity<AccountResponse> withdraw(
            @Parameter(description = "Account number") @PathVariable String accountNumber,
            @Valid @RequestBody WithdrawRequest request) {
        AccountResponse response = accountService.withdraw(accountNumber, request.getAmount(), request.getDescription());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/transfer")
    @Operation(summary = "4. Atomic Fund Transfer", description = "Transfer money between two accounts atomically within one MongoDB transaction.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Transfer completed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request or same account"),
            @ApiResponse(responseCode = "404", description = "Source or destination account not found"),
            @ApiResponse(responseCode = "409", description = "Insufficient funds in source account")
    })
    public ResponseEntity<TransactionResponse> transferFunds(@Valid @RequestBody TransferRequest request) {
        TransactionResponse response = accountService.transferFunds(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{accountNumber}/mini-statement")
    @Operation(summary = "6. Mini Statement", description = "Return the last 10 transactions for an account sorted from most recent to oldest.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Mini statement retrieved"),
            @ApiResponse(responseCode = "404", description = "Account not found")
    })
    public ResponseEntity<List<TransactionResponse>> getMiniStatement(
            @Parameter(description = "Account number") @PathVariable String accountNumber) {
        List<TransactionResponse> statement = accountService.getMiniStatement(accountNumber);
        return ResponseEntity.ok(statement);
    }

    @PostMapping("/calculate-savings-interest")
    @Operation(summary = "8a. Compute & Apply Savings Interest", description = "Calculate and apply monthly simple interest to all eligible savings accounts.")
    public ResponseEntity<InterestCalculationResult> applySavingsInterest(
            @RequestParam(required = false) Double customAnnualRate) {
        InterestCalculationResult result = accountService.calculateAndApplySavingsInterest(customAnnualRate);
        return ResponseEntity.ok(result);
    }
}
