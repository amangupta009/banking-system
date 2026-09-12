# 🏦 APEX Core Banking — Full-Stack Banking Application

A full-stack banking platform with a **React dashboard frontend** and a **Spring Boot 3 + MongoDB backend**. Every account, loan, and transaction is stored in MongoDB and kept in sync between the frontend and backend in real time.

---

## 🧩 Tech Stack

| Layer | Technology |
|------|-----------|
| **Frontend** | React 19, Vite 6, TypeScript, Tailwind CSS 4, lucide-react |
| **Backend** | Java 17, Spring Boot 3.3.4, Spring Data MongoDB |
| **Database** | MongoDB (replica set `rs0`, required for transactions) |
| **Security** | BCrypt password hashing |
| **API Docs** | SpringDoc OpenAPI (Swagger UI) |

---

## ✨ Features

**Frontend (React)**
- Dashboard with live account balances and customer search
- Open account, deposit, withdraw, and atomic fund transfers
- Balance enquiry & mini-statement (last 10 transactions)
- Loan application, approval, disbursement, and repayment
- Loading/error states on every operation; fully wired to the backend API

**Backend (Spring Boot)**
- Atomic multi-document transactions via `@Transactional` (deposit/withdraw/transfer roll back atomically)
- BCrypt-hashed PIN/password, overdraft protection with clear `409` errors
- Full loan lifecycle with reducing-balance interest calculations
- Seeded demo data on first run + Swagger UI at `/swagger-ui.html`

---

## 📁 Project Structure

```
apex-banking-website/
├── src/                     # React frontend
│   ├── api/client.ts        # Typed API client (proxy: /api → localhost:8080)
│   ├── App.tsx              # Main dashboard UI + all operation handlers
│   └── main.tsx / index.css
├── banking-app/             # Spring Boot backend
│   └── src/main/java/com/bank/app/
│       ├── controller/      # REST endpoints (Account, Loan)
│       ├── service/         # Business logic incl. transactions & loans
│       ├── model/           # Account, Transaction, Loan entities
│       ├── repository/      # MongoDB repositories
│       ├── dto/             # Request/response objects
│       ├── exception/       # Global error handling
│       ├── config/          # CORS, OpenAPI, Mongo config
│       ├── DataSeeder.java  # Seeds accounts 1001–1003 + loan LN-SEED-101
│       └── resources/       # application.properties, static UI build
```

---

## 🚀 Quick Start

> **Prerequisites:** Java 17+, Maven 3.8+, Node.js 18+, MongoDB (mongosh/Compass).

### 1. Start MongoDB as a replica set (REQUIRED)

Multi-document transactions (`@Transactional`) need MongoDB running as a replica set:

```bash
mongod --replSet rs0 --dbpath <path-to-your-db-folder>
```

Then once (from a separate terminal):

```bash
mongosh --eval "rs.initiate()"
```

Verify:

```bash
mongosh --eval "rs.status().ok"
# Should output: 1
```

Compass URI: `mongodb://localhost:27017/?replicaSet=rs0`

### 2. Run the Backend (port `8080`)

```bash
cd banking-app
mvn spring-boot:run
```

Or build + run:

```bash
mvn clean package -DskipTests && java -jar target/banking-service-1.0.0.jar
```

### 3. Run the Frontend (Vite dev server)

In a second terminal:

```bash
npm install
npm run dev
```

Open **http://localhost:3000** (port `3001` if `3000` is taken). The frontend proxies `/api` requests to the backend on `8080`.

> The backend also serves a pre-built copy of the frontend at **http://localhost:8080/**.

### 4. Swagger UI

👉 **[http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)**

---

## 👤 Demo Accounts (auto-seeded on empty DB)

| Account | Holder | Type | Balance | PIN |
|---------|--------|------|--------|-----|
| `1001` | John Doe | SAVINGS | $5,000.00 | `1234` |
| `1002` | Jane Smith | SAVINGS | $3,500.00 | `1234` |
| `1003` | Acme Corp | CURRENT | $25,000.00 | `1234` |
| Loan `LN-SEED-101` | John Doe | — | $10,000.00 (APPROVED, ready to disburse) | — |

New accounts get auto-generated **4-digit** account numbers (e.g. the next one is `1004`).

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/accounts` | List all accounts (drives customer search) |
| `POST` | `/api/v1/accounts` | Open a new account |
| `GET` | `/api/v1/accounts/{number}` | Account details |
| `POST` | `/api/v1/accounts/{number}/deposit` | Deposit funds |
| `POST` | `/api/v1/accounts/{number}/withdraw` | Withdraw funds |
| `POST` | `/api/v1/accounts/transfer` | Atomic fund transfer |
| `GET` | `/api/v1/accounts/{number}/balance` | Balance enquiry |
| `GET` | `/api/v1/accounts/{number}/mini-statement` | Last 10 transactions |
| `POST` | `/api/v1/accounts/calculate-savings-interest` | Apply savings interest |
| `POST` | `/api/v1/loans/apply` | Apply for a loan |
| `PUT` | `/api/v1/loans/{id}/review` | Approve / reject loan |
| `POST` | `/api/v1/loans/{id}/disburse` | Disburse approved loan |
| `POST` | `/api/v1/loans/{id}/repay` | Repay loan installment |
| `POST` | `/api/v1/loans/calculate-loan-interest` | Compute active loan interest |

---

## 🧪 Example API Calls

**Open an account** (returns auto-generated 4-digit number, e.g. `1005`):
```bash
curl -X POST http://localhost:8080/api/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{"holderName":"Alice Johnson","accountType":"SAVINGS","initialDeposit":1500.00,"pin":"4321"}'
```

**Deposit:**
```bash
curl -X POST http://localhost:8080/api/v1/accounts/1001/deposit \
  -H "Content-Type: application/json" \
  -d '{"amount":750.00,"description":"Salary Bonus Deposit"}'
```

**Withdraw** (returns `409 Conflict` if amount exceeds balance):
```bash
curl -X POST http://localhost:8080/api/v1/accounts/1001/withdraw \
  -H "Content-Type: application/json" \
  -d '{"amount":200.00,"description":"ATM Cash Withdrawal"}'
```

**Atomic transfer** (rolls back entirely if either step fails):
```bash
curl -X POST http://localhost:8080/api/v1/accounts/transfer \
  -H "Content-Type: application/json" \
  -d '{"fromAccountNumber":"1001","toAccountNumber":"1002","amount":1000.00,"remarks":"Payment"}'
```

**Mini statement:**
```bash
curl -X GET http://localhost:8080/api/v1/accounts/1001/mini-statement
```

**Disburse seeded loan** (second call → `409 Conflict`, no double disbursement):
```bash
curl -X POST http://localhost:8080/api/v1/loans/LN-SEED-101/disburse
```

**Repay loan** (reducing-balance method):
```bash
curl -X POST http://localhost:8080/api/v1/loans/LN-SEED-101/repay \
  -H "Content-Type: application/json" \
  -d '{"amount":1000.00}'
```

**Batch interest:**
```bash
curl -X POST http://localhost:8080/api/v1/accounts/calculate-savings-interest
curl -X POST http://localhost:8080/api/v1/loans/calculate-loan-interest
```

---

## 🗄️ Database Collections (MongoDB)

1. **`accounts`** — `accountNumber` (unique), `holderName`, `accountType` (`SAVINGS`/`CURRENT`), `balance`, `interestRate`, `passwordHash` (BCrypt), `createdAt`
2. **`transactions`** — `transactionId` (unique), `accountNumber`, `type` (`DEPOSIT`, `WITHDRAW`, `TRANSFER_IN`, `TRANSFER_OUT`, `LOAN_DISBURSEMENT`, `LOAN_REPAYMENT`, `INTEREST_CREDIT`), `amount`, `balanceAfter`, `timestamp`, `relatedAccount`
3. **`loans`** — `loanId` (unique), `accountNumber`, `principal`, `interestRate`, `tenureMonths`, `status` (`PENDING`, `APPROVED`, `REJECTED`, `ACTIVE`, `CLOSED`), `outstandingBalance`, `repaymentHistory`

---

## ⚠️ Notes

- MongoDB **must** run as replica set `rs0` or transactional operations will fail.
- Seed data is inserted **only when the database is empty**.