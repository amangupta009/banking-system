package com.bank.app.exception;

public class LoanProcessingException extends RuntimeException {
    public LoanProcessingException(String message) {
        super(message);
    }
}
