package com.bank.app.repository;

import com.bank.app.model.Loan;
import com.bank.app.model.LoanStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanRepository extends MongoRepository<Loan, String> {

    Optional<Loan> findByLoanId(String loanId);

    List<Loan> findByAccountNumber(String accountNumber);

    List<Loan> findByStatus(LoanStatus status);
}
