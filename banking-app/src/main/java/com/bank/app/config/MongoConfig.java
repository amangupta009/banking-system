package com.bank.app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.MongoTransactionManager;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * MongoDB Configuration
 * Enables Spring's @Transactional support with MongoDB multi-document transactions
 * and configures password hashing via BCrypt.
 */
@Configuration
@EnableTransactionManagement
@EnableMongoRepositories(basePackages = "com.bank.app.repository")
public class MongoConfig {

    /**
     * MongoTransactionManager allows Spring's @Transactional annotation to manage
     * multi-document transactions across MongoDB collections.
     * Note: MongoDB transactions require a replica set (standalone mongod does not support transactions).
     */
    @Bean
    public MongoTransactionManager transactionManager(MongoDatabaseFactory dbFactory) {
        return new MongoTransactionManager(dbFactory);
    }

    /**
     * BCrypt PasswordEncoder for hashing sensitive customer data (such as account PINs or passwords).
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
