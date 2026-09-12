package com.bank.app.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI bankingOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Banking Application REST API")
                        .description("Production-grade Spring Boot 3 & MongoDB banking API for Account, Transaction, and Loan management with atomic transactions.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Bank Engineering Team")
                                .email("engineering@bank.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://spring.io")));
    }
}
