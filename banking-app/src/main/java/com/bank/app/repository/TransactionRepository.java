package com.bank.app.repository;

import com.bank.app.model.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends MongoRepository<Transaction, String> {

    Optional<Transaction> findByTransactionId(String transactionId);

    /**
     * Fetch the last 10 transactions for an account sorted by timestamp descending
     * used for the Mini Statement requirement.
     */
    List<Transaction> findTop10ByAccountNumberOrderByTimestampDesc(String accountNumber);

    List<Transaction> findByAccountNumberOrderByTimestampDesc(String accountNumber);
}
