package com.bank.app.dto;

import com.bank.app.model.AccountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class OpenAccountRequest {

    @NotBlank(message = "Account holder name is required")
    @Size(min = 2, max = 100, message = "Holder name must be between 2 and 100 characters")
    private String holderName;

    @NotNull(message = "Account type is required (SAVINGS or CURRENT)")
    private AccountType accountType;

    @NotNull(message = "Initial deposit amount is required")
    @DecimalMin(value = "0.00", message = "Initial deposit cannot be negative")
    private BigDecimal initialDeposit;

    /**
     * Optional customer secret/PIN that will be hashed with BCrypt
     */
    @Size(min = 4, max = 20, message = "PIN/Password must be between 4 and 20 characters if provided")
    private String pin;

    public OpenAccountRequest() {
    }

    public OpenAccountRequest(String holderName, AccountType accountType, BigDecimal initialDeposit, String pin) {
        this.holderName = holderName;
        this.accountType = accountType;
        this.initialDeposit = initialDeposit;
        this.pin = pin;
    }

    public String getHolderName() {
        return holderName;
    }

    public void setHolderName(String holderName) {
        this.holderName = holderName;
    }

    public AccountType getAccountType() {
        return accountType;
    }

    public void setAccountType(AccountType accountType) {
        this.accountType = accountType;
    }

    public BigDecimal getInitialDeposit() {
        return initialDeposit;
    }

    public void setInitialDeposit(BigDecimal initialDeposit) {
        this.initialDeposit = initialDeposit;
    }

    public String getPin() {
        return pin;
    }

    public void setPin(String pin) {
        this.pin = pin;
    }
}
