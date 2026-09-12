export interface ApiAccount {
  accountNumber: string;
  holderName: string;
  accountType: 'SAVINGS' | 'CURRENT';
  balance: number;
  interestRate: number;
  createdAt: string;
  [key: string]: unknown;
}

export interface ApiTransaction {
  transactionId: string;
  accountNumber: string;
  type: string;
  amount: number;
  balanceAfter: number;
  timestamp: string;
  relatedAccount?: string | null;
  description: string;
}

export interface ApiLoanRepayment {
  repaymentId: string;
  amount: number;
  principalPortion: number;
  interestPortion: number;
  remainingBalance: number;
  timestamp: string;
}

export interface ApiLoan {
  loanId: string;
  accountNumber: string;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'CLOSED';
  createdAt: string;
  approvedAt?: string | null;
  disbursedAt?: string | null;
  outstandingBalance: number;
  repaymentHistory: ApiLoanRepayment[];
}

export interface ApiBalance {
  accountNumber: string;
  holderName: string;
  currentBalance: number;
  asOf: string;
}

export interface ApiInterestResult {
  calculationType: string;
  accountsOrLoansProcessed: number;
  totalInterestCalculated: number;
  processedAt: string;
  details: string[];
}

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://banking-system-hm95.onrender.com/api/v1'
    : '/api/v1');

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE_URL + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (err) {
    throw new ApiError(0, 'Backend unreachable. Please check the server is running on port 8080.');
  }

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body && typeof body.message === 'string') {
        message = body.message;
      }
      if (body && body.validationErrors && typeof body.validationErrors === 'object') {
        const details = Object.entries(body.validationErrors)
          .map(([key, value]) => `${key}: ${String(value)}`)
          .join(', ');
        message = details ? `${message} (${details})` : message;
      }
    } catch {
      // keep default message
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

export interface OpenAccountPayload {
  holderName: string;
  accountType: 'SAVINGS' | 'CURRENT';
  initialDeposit: number;
  pin?: string;
}

export interface DepositPayload {
  amount: number;
  description?: string;
}

export interface WithdrawPayload {
  amount: number;
  description?: string;
}

export interface TransferPayload {
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  remarks?: string;
}

export interface ApplyLoanPayload {
  accountNumber: string;
  principal: number;
  tenureMonths: number;
  interestRate?: number;
}

export interface RepayLoanPayload {
  amount: number;
}

export const api = {
  getAccounts: () => request<ApiAccount[]>('/accounts'),

  getAccount: (accountNumber: string) =>
    request<ApiAccount>(`/accounts/${encodeURIComponent(accountNumber)}`),

  getBalance: (accountNumber: string) =>
    request<ApiBalance>(`/accounts/${encodeURIComponent(accountNumber)}/balance`),

  getMiniStatement: (accountNumber: string) =>
    request<ApiTransaction[]>(`/accounts/${encodeURIComponent(accountNumber)}/mini-statement`),

  openAccount: (payload: OpenAccountPayload) =>
    request<ApiAccount>('/accounts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deposit: (accountNumber: string, payload: DepositPayload) =>
    request<ApiAccount>(`/accounts/${encodeURIComponent(accountNumber)}/deposit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  withdraw: (accountNumber: string, payload: WithdrawPayload) =>
    request<ApiAccount>(`/accounts/${encodeURIComponent(accountNumber)}/withdraw`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  transfer: (payload: TransferPayload) =>
    request<ApiTransaction>('/accounts/transfer', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  calculateSavingsInterest: (customAnnualRate?: number) =>
    request<ApiInterestResult>(
      `/accounts/calculate-savings-interest${customAnnualRate ? `?customAnnualRate=${customAnnualRate}` : ''}`,
      { method: 'POST' },
    ),

  getLoans: () => request<ApiLoan[]>('/loans'),

  getLoansByAccount: (accountNumber: string) =>
    request<ApiLoan[]>(`/loans/account/${encodeURIComponent(accountNumber)}`),

  applyLoan: (payload: ApplyLoanPayload) =>
    request<ApiLoan>('/loans/apply', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  reviewLoan: (loanId: string, approve: boolean) =>
    request<ApiLoan>(`/loans/${encodeURIComponent(loanId)}/review`, {
      method: 'PUT',
      body: JSON.stringify({ approve }),
    }),

  disburseLoan: (loanId: string) =>
    request<ApiLoan>(`/loans/${encodeURIComponent(loanId)}/disburse`, {
      method: 'POST',
    }),

  repayLoan: (loanId: string, payload: RepayLoanPayload) =>
    request<ApiLoan>(`/loans/${encodeURIComponent(loanId)}/repay`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  calculateLoanInterest: () =>
    request<ApiInterestResult>('/loans/calculate-loan-interest', { method: 'POST' }),
};