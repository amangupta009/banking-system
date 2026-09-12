package com.bank.app;

import com.bank.app.model.*;
import com.bank.app.repository.AccountRepository;
import com.bank.app.repository.LoanRepository;
import com.bank.app.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DataSeeder runs on application startup.
 * If the MongoDB database is empty, it initializes sample accounts and transactions
 * so the banking system can be tested immediately in Swagger UI or via curl.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final LoanRepository loanRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(AccountRepository accountRepository,
                      TransactionRepository transactionRepository,
                      LoanRepository loanRepository,
                      PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.loanRepository = loanRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (accountRepository.count() > 0) {
            log.info("Database already contains accounts. Skipping seeding.");
            return;
        }

        log.info("Seeding initial sample banking data into MongoDB...");

        Instant now = Instant.now();
        String defaultPinHash = passwordEncoder.encode("1234");

        // 1. Savings Account - John Doe
        Account johnAccount = new Account(
                "1001",
                "John Doe",
                AccountType.SAVINGS,
                new BigDecimal("5000.00"),
                new BigDecimal("0.0400"),
                defaultPinHash,
                now
        );
        accountRepository.save(johnAccount);
        transactionRepository.save(new Transaction(
                "TXN-SEED-001",
                "1001",
                TransactionType.DEPOSIT,
                new BigDecimal("5000.00"),
                new BigDecimal("5000.00"),
                now,
                null,
                "Initial account opening balance"
        ));

        // 2. Savings Account - Jane Smith
        Account janeAccount = new Account(
                "1002",
                "Jane Smith",
                AccountType.SAVINGS,
                new BigDecimal("3500.00"),
                new BigDecimal("0.0400"),
                defaultPinHash,
                now
        );
        accountRepository.save(janeAccount);
        transactionRepository.save(new Transaction(
                "TXN-SEED-002",
                "1002",
                TransactionType.DEPOSIT,
                new BigDecimal("3500.00"),
                new BigDecimal("3500.00"),
                now,
                null,
                "Initial account opening balance"
        ));

        // 3. Current Account - Acme Corporation
        Account acmeAccount = new Account(
                "1003",
                "Acme Corporation",
                AccountType.CURRENT,
                new BigDecimal("25000.00"),
                BigDecimal.ZERO,
                defaultPinHash,
                now
        );
        accountRepository.save(acmeAccount);
        transactionRepository.save(new Transaction(
                "TXN-SEED-003",
                "1003",
                TransactionType.DEPOSIT,
                new BigDecimal("25000.00"),
                new BigDecimal("25000.00"),
                now,
                null,
                "Initial corporate opening balance"
        ));

        // 4. Seed a sample loan in APPROVED status ready for disbursement testing
        Loan sampleLoan = new Loan(
                "LN-SEED-101",
                "1001",
                new BigDecimal("10000.00"),
                new BigDecimal("0.0850"),
                24,
                LoanStatus.APPROVED,
                now,
                new BigDecimal("10000.00")
        );
        sampleLoan.setApprovedAt(now);
        loanRepository.save(sampleLoan);

        log.info("Database seeding complete! Seeded 3 accounts (1001, 1002, 1003) and 1 sample loan (LN-SEED-101).");
    }
}
