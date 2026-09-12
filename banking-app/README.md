# Banking Backend (Spring Boot)

Spring Boot 3 + MongoDB backend for the **APEX Core Banking** application.

> 📖 Complete project setup, demo accounts, and API examples live in the **[root README](../README.md)** — start there.

Run from this directory:

```bash
mvn spring-boot:run   # starts on http://localhost:8080
```

Swagger UI: http://localhost:8080/swagger-ui.html

## What's inside

| Area | Highlights |
|------|-----------|
| **Accounts** | Open, deposit, withdraw, transfer, balance enquiry, mini-statement, customer search |
| **Loans** | Apply, review (approve/reject), disburse, repay with reducing-balance interest |
| **Transactions** | Atomic multi-document via `@Transactional` (requires MongoDB replica set), full audit trail |
| **Security** | BCrypt-hashed PIN/password |
| **API docs** | SpringDoc OpenAPI at `/swagger-ui.html` |

## Config

- MongoDB: `localhost:27017`, database `banking_db`
- Replica set `rs0` is **required** (for transactions) — see root README for setup
- CORS allows `http://localhost:*` / `http://127.0.0.1:*` for the Vite dev server
- Seed data (`DataSeeder`) runs only when the database is empty:
  - Accounts `1001`–`1003`, PIN `1234`, plus a pre-approved loan `LN-SEED-101`

## Build

```bash
mvn clean package -DskipTests
java -jar target/banking-service-1.0.0.jar
```

> The backend also serves a pre-built copy of the React frontend from `src/main/resources/static/`. Rebuild it with `npm run build` (from the project root) and copy the output there if you want the backend-served UI to stay current.