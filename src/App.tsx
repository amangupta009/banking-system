import React, { useState, useEffect } from 'react';
import {
  Building2,
  Landmark,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  ShieldCheck,
  DollarSign,
  Percent,
  UserPlus,
  Eye,
  Check,
  Copy,
  Receipt,
  PiggyBank,
  CheckCircle,
  XCircle,
  TrendingUp,
  Layers,
  ChevronRight,
  Info,
  Search,
  UserCheck,
  Wallet,
  Users,
  RotateCcw
} from 'lucide-react';
import { api } from './api/client';

interface AccountState {
  accountNumber: string;
  holderName: string;
  accountType: 'SAVINGS' | 'CURRENT';
  balance: number;
  interestRate: number;
  createdAt: string;
  pinHash?: string;
}

interface TransactionState {
  transactionId: string;
  accountNumber: string;
  type: string;
  amount: number;
  balanceAfter: number;
  timestamp: string;
  relatedAccount?: string;
  description: string;
}

interface LoanRepaymentState {
  repaymentId: string;
  amount: number;
  principalPortion: number;
  interestPortion: number;
  remainingBalance: number;
  timestamp: string;
}

interface LoanState {
  loanId: string;
  accountNumber: string;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'CLOSED';
  outstandingBalance: number;
  createdAt: string;
  disbursedAt?: string;
  repaymentHistory: LoanRepaymentState[];
}

type ActiveModal =
  | null
  | 'OPEN_ACCOUNT'
  | 'DEPOSIT'
  | 'WITHDRAW'
  | 'TRANSFER'
  | 'BALANCE_ENQUIRY'
  | 'MINI_STATEMENT'
  | 'APPLY_LOAN'
  | 'REPAY_LOAN'
  | 'SEARCH_USER';

export default function App() {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts'>('dashboard');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Core State (fully backed by the banking backend API + MongoDB)
  const [accounts, setAccounts] = useState<AccountState[]>([]);
  const [transactions, setTransactions] = useState<TransactionState[]>([]);
  const [loans, setLoans] = useState<LoanState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Selected Target Account
  const [selectedAccNum, setSelectedAccNum] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState('');

  const refreshData = async () => {
    const apiAccounts = await api.getAccounts();
    const apiLoans = await api.getLoans();

    const statementPromises = apiAccounts.map((acct) =>
      api.getMiniStatement(acct.accountNumber).catch(() => [])
    );
    const statements = await Promise.all(statementPromises);
    const allTxns = statements.flat();

    setAccounts(apiAccounts);
    setLoans(apiLoans);
    setTransactions(allTxns);
    setSelectedAccNum((prev) =>
      prev && apiAccounts.some((a) => a.accountNumber === prev)
        ? prev
        : (apiAccounts[0]?.accountNumber ?? '')
    );
    setSelectedLoanId((prev) =>
      prev && apiLoans.some((l) => l.loanId === prev) ? prev : (apiLoans[0]?.loanId ?? '')
    );
  };

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      await refreshData();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load data from the banking backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Accounts Directory Search & Filter States
  const [accountFilterQuery, setAccountFilterQuery] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState<'ALL' | 'SAVINGS' | 'CURRENT'>('ALL');

  const filteredAccounts = accounts.filter((acc) => {
    const matchesType = accountTypeFilter === 'ALL' || acc.accountType === accountTypeFilter;
    const q = accountFilterQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      acc.accountNumber.toLowerCase().includes(q) ||
      acc.holderName.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  // Reload Latest Data from the Backend Database
  const handleReloadFromBackend = async () => {
    try {
      await refreshData();
      showToast('success', 'Data Synced from Database', 'Accounts, loans, and transactions reloaded directly from MongoDB.');
    } catch (err) {
      showToast('error', 'Sync Failed', err instanceof Error ? err.message : 'Failed to reload data.');
    }
  };

  // Form Inputs
  const [formHolderName, setFormHolderName] = useState('');
  const [formAccountType, setFormAccountType] = useState<'SAVINGS' | 'CURRENT'>('SAVINGS');
  const [formInitialDeposit, setFormInitialDeposit] = useState('1000');
  const [formPin, setFormPin] = useState('1234');

  const [formAmount, setFormAmount] = useState('250');
  const [formDescription, setFormDescription] = useState('Cash Deposit');

  const [transferFrom, setTransferFrom] = useState('1001');
  const [transferTo, setTransferTo] = useState('1002');
  const [transferAmount, setTransferAmount] = useState('500');
  const [transferRemarks, setTransferRemarks] = useState('Project payment');

  const [loanAccount, setLoanAccount] = useState('1001');
  const [loanPrincipal, setLoanPrincipal] = useState('5000');
  const [loanTenure, setLoanTenure] = useState('12');
  const [loanCustomRate, setLoanCustomRate] = useState('0.085');

  const [repayAmount, setRepayAmount] = useState('500');

  // Dedicated Inputs for Manual User Searches & Modal Contexts
  const [switchAccInput, setSwitchAccInput] = useState('');
  const [balanceEnquiryInput, setBalanceEnquiryInput] = useState('1001');
  const [statementSearchInput, setStatementSearchInput] = useState('1001');
  const [activeStatementAcc, setActiveStatementAcc] = useState('1001');

  // Search User States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState<AccountState | null>(null);
  const [searchHasExecuted, setSearchHasExecuted] = useState(false);
  const [searchErrorMessage, setSearchErrorMessage] = useState('');

  // Notification Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 5000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Selected Account Object
  const currentAccount = accounts.find((a) => a.accountNumber === selectedAccNum) || accounts[0];

  // Total Statistics
  const totalReserves = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalSavings = accounts.filter((a) => a.accountType === 'SAVINGS').reduce((sum, a) => sum + a.balance, 0);
  const activeLoansCount = loans.filter((l) => l.status === 'ACTIVE').length;
  const pendingLoansCount = loans.filter((l) => l.status === 'PENDING').length;
  const approvedLoansCount = loans.filter((l) => l.status === 'APPROVED').length;

  // 1. OPEN ACCOUNT
  const handleOpenAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const deposit = parseFloat(formInitialDeposit);
    if (isNaN(deposit) || deposit < 0) {
      showToast('error', 'Invalid Deposit', 'Initial deposit must be 0 or a positive number.');
      return;
    }
    try {
      const created = await api.openAccount({
        holderName: formHolderName.trim() || 'Valued Customer',
        accountType: formAccountType,
        initialDeposit: deposit,
        pin: formPin.trim() || undefined,
      });
      await refreshData();
      setSelectedAccNum(created.accountNumber);
      setActiveModal(null);
      setFormHolderName('');
      setFormInitialDeposit('1000');
      showToast(
        'success',
        'Account Opened & Saved to Database',
        `Account #${created.accountNumber} for ${created.holderName} was created and stored in MongoDB.`
      );
    } catch (err) {
      showToast('error', 'Account Creation Failed', err instanceof Error ? err.message : 'Unknown error.');
    }
  };

  // 2. DEPOSIT
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('error', 'Bad Request (400)', 'Deposit amount must be strictly greater than 0.');
      return;
    }
    try {
      const updated = await api.deposit(selectedAccNum, {
        amount: amt,
        description: formDescription.trim() || undefined,
      });
      await refreshData();
      setActiveModal(null);
      showToast(
        'success',
        'Deposit Successful (200 OK)',
        `Credited $${amt.toFixed(2)} to account #${updated.accountNumber}. New balance: $${updated.balance.toFixed(2)}.`
      );
    } catch (err) {
      showToast('error', 'Deposit Failed', err instanceof Error ? err.message : 'Unknown error.');
    }
  };

  // 3. WITHDRAW
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('error', 'Bad Request (400)', 'Withdrawal amount must be strictly greater than 0.');
      return;
    }
    try {
      const updated = await api.withdraw(selectedAccNum, {
        amount: amt,
        description: formDescription.trim() || undefined,
      });
      await refreshData();
      setActiveModal(null);
      showToast(
        'success',
        'Withdrawal Successful (200 OK)',
        `Deducted $${amt.toFixed(2)} from #${updated.accountNumber}. New balance: $${updated.balance.toFixed(2)}.`
      );
    } catch (err) {
      showToast('error', 'Withdrawal Failed', err instanceof Error ? err.message : 'Unknown error.');
    }
  };

  // 4. ATOMIC TRANSFER
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transferFrom === transferTo) {
      showToast('error', 'Invalid Transfer (400)', 'Source and destination accounts cannot be the same account.');
      return;
    }
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('error', 'Bad Request (400)', 'Transfer amount must be strictly positive.');
      return;
    }
    try {
      await api.transfer({
        fromAccountNumber: transferFrom,
        toAccountNumber: transferTo,
        amount: amt,
        remarks: transferRemarks.trim() || undefined,
      });
      await refreshData();
      setActiveModal(null);
      showToast(
        'success',
        'Atomic Transfer Complete (200 OK)',
        `$${amt.toFixed(2)} transferred from #${transferFrom} to #${transferTo} atomically. Both records updated in MongoDB.`
      );
    } catch (err) {
      showToast('error', 'Transfer Failed', err instanceof Error ? err.message : 'Unknown error.');
    }
  };

  // 7. LOAN ACTIONS: APPLY
  const handleApplyLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(loanPrincipal);
    const t = parseInt(loanTenure, 10);
    const r = parseFloat(loanCustomRate);

    if (isNaN(p) || p < 100) {
      showToast('error', 'Bad Request (400)', 'Minimum loan principal is $100.00.');
      return;
    }
    if (isNaN(t) || t < 1) {
      showToast('error', 'Bad Request (400)', 'Tenure must be at least 1 month.');
      return;
    }
    try {
      const created = await api.applyLoan({
        accountNumber: loanAccount,
        principal: p,
        tenureMonths: t,
        interestRate: isNaN(r) ? undefined : r,
      });
      await refreshData();
      setSelectedLoanId(created.loanId);
      setActiveModal(null);
      showToast(
        'success',
        'Loan Application Created (201 Created)',
        `Loan ${created.loanId} for $${p.toFixed(2)} submitted in PENDING state. Awaiting Admin Review.`
      );
    } catch (err) {
      showToast('error', 'Loan Application Failed', err instanceof Error ? err.message : 'Unknown error.');
    }
  };

  // 7. LOAN ACTIONS: APPROVE / REJECT
  const handleReviewLoan = async (loanId: string, approve: boolean) => {
    try {
      const updated = await api.reviewLoan(loanId, approve);
      await refreshData();
      showToast(
        'success',
        approve ? 'Loan Approved' : 'Loan Rejected',
        `Loan ${updated.loanId} is now marked as ${approve ? 'APPROVED (Ready to disburse)' : 'REJECTED'}.`
      );
    } catch (err) {
      showToast('error', 'Loan Review Failed', err instanceof Error ? err.message : 'Unknown error.');
    }
  };

  // 7. LOAN ACTIONS: DISBURSE
  const handleDisburseLoan = async (loanId: string) => {
    try {
      const updated = await api.disburseLoan(loanId);
      await refreshData();
      showToast(
        'success',
        'Loan Disbursed & Balance Credited (200 OK)',
        `$${updated.principal.toFixed(2)} disbursed directly to account #${updated.accountNumber}. Loan is now ACTIVE with double-disbursement lock.`
      );
    } catch (err) {
      showToast('error', 'Disbursement Failed', err instanceof Error ? err.message : 'Unknown error.');
    }
  };

  // 7. LOAN ACTIONS: REPAY (Reducing Balance Method)
  const handleRepayLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(repayAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('error', 'Bad Request (400)', 'Repayment amount must be strictly greater than 0.');
      return;
    }
    try {
      const updated = await api.repayLoan(selectedLoanId, { amount: amt });
      await refreshData();
      setActiveModal(null);
      const lastRepayment = updated.repaymentHistory[updated.repaymentHistory.length - 1];
      const isFullyPaid = updated.status === 'CLOSED';
      showToast(
        'success',
        isFullyPaid ? 'Loan Fully Closed (200 OK)' : 'Repayment Recorded (200 OK)',
        `Paid $${amt.toFixed(2)} (Principal: $${lastRepayment.principalPortion.toFixed(2)}, Interest: $${lastRepayment.interestPortion.toFixed(2)}). Remaining: $${updated.outstandingBalance.toFixed(2)}.`
      );
    } catch (err) {
      showToast('error', 'Repayment Failed', err instanceof Error ? err.message : 'Unknown error.');
    }
  };

  // 8. SAVINGS INTEREST CALCULATION (Simple Interest, 4% p.a.)
  const handleApplySavingsInterest = async () => {
    try {
      const result = await api.calculateSavingsInterest();
      await refreshData();
      setActiveModal(null);
      showToast(
        'success',
        'Savings Interest Applied (200 OK)',
        `Calculated & credited monthly interest on savings accounts. Total $${result.totalInterestCalculated.toFixed(2)} added across ${result.accountsOrLoansProcessed} account(s).`
      );
    } catch (err) {
      showToast('error', 'Interest Calculation Failed', err instanceof Error ? err.message : 'Unknown error.');
    }
  };

  // 8. ACTIVE LOAN INTEREST CALCULATION (Reducing Balance Method)
  const handleApplyLoanInterest = async () => {
    try {
      const result = await api.calculateLoanInterest();
      await refreshData();
      setActiveModal(null);
      showToast(
        'success',
        'Loan Interest Accrued (200 OK)',
        `Computed reducing balance interest on active loans. Total accrued: $${result.totalInterestCalculated.toFixed(2)}.`
      );
    } catch (err) {
      showToast('error', 'Interest Calculation Failed', err instanceof Error ? err.message : 'Unknown error.');
    }
  };

  // Get Last 10 Transactions for Mini Statement
  const miniStatement = transactions
    .filter((t) => t.accountNumber === selectedAccNum)
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-md w-full shadow-2xl rounded-xl border p-4 flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'success'
              ? 'bg-slate-900 border-emerald-500/80 text-emerald-100'
              : 'bg-slate-900 border-rose-500/80 text-rose-100'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{toast.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white">APEX CORE BANKING</span>
          </div>
        </div>

        {/* Navigation Tabs & Download */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-2.5 sm:px-7 sm:py-3 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Building2 className="w-5 h-5" />
              Dashboard
            </button>
            <button
              id="nav-tab-accounts"
              onClick={() => setActiveTab('accounts')}
              className={`px-6 py-2.5 sm:px-7 sm:py-3 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'accounts'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Receipt className="w-5 h-5" />
              Accounts ({accounts.length})
            </button>
          </div>

        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-7">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mb-4" />
            <p className="text-sm text-slate-300 font-semibold">Connecting to banking backend database...</p>
            <p className="text-xs text-slate-500 mt-1">Fetching accounts &amp; loans from MongoDB</p>
          </div>
        )}

        {!isLoading && loadError && (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-slate-900/60 border border-rose-800 rounded-2xl p-6">
            <AlertCircle className="w-8 h-8 text-rose-400 mb-3" />
            <h3 className="text-base font-bold text-white">Could Not Reach Backend</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-md">{loadError}</p>
            <button
              type="button"
              onClick={handleReloadFromBackend}
              className="mt-4 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}
        {/* TAB: DASHBOARD */}
        {!isLoading && !loadError && activeTab === 'dashboard' && (
          <div className="space-y-7">
            {/* Dashboard Action Buttons Grid: Banking Operations Hub */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-950/80 text-blue-400 border border-blue-800/80">
                      Central Command
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2.5">
                    <Landmark className="w-6 h-6 text-blue-400" />
                    Banking Operations Hub
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    Select an operation below to perform instantaneous core transactions, inquiries, and customer records
                  </p>
                </div>
              </div>

              {/* Dynamic Responsive Buttons Grid: expands/contracts smoothly with viewport width */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full">
                {/* 1. Open Account */}
                <button
                  id="btn-open-account"
                  type="button"
                  onClick={() => setActiveModal('OPEN_ACCOUNT')}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-emerald-500/70 p-5 sm:p-6 text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-950/40 active:translate-y-0 active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all" />
                  <div>
                    <div className="flex items-center justify-between w-full mb-4">
                      <div className="w-13 h-13 rounded-2xl bg-emerald-950/80 border border-emerald-800/70 text-emerald-400 flex items-center justify-center shadow-lg group-hover:bg-emerald-500 group-hover:text-slate-950 group-hover:scale-110 transition-all duration-300">
                        <UserPlus className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/60 shadow-sm">
                        #01
                      </span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Open Account
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                      Register new customer account with 4-digit number &amp; initial deposit
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                    <span>Open Registration Form</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </button>

                {/* 2. Deposit Funds */}
                <button
                  id="btn-deposit"
                  type="button"
                  onClick={() => {
                    setFormDescription('Cash Deposit');
                    setActiveModal('DEPOSIT');
                  }}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-blue-500/70 p-5 sm:p-6 text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-950/40 active:translate-y-0 active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/15 transition-all" />
                  <div>
                    <div className="flex items-center justify-between w-full mb-4">
                      <div className="w-13 h-13 rounded-2xl bg-blue-950/80 border border-blue-800/70 text-blue-400 flex items-center justify-center shadow-lg group-hover:bg-blue-500 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                        <ArrowDownLeft className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-800/60 shadow-sm">
                        #02
                      </span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                      Deposit Funds
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                      Credit cash or electronic funds directly into verified balance
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-blue-400 group-hover:text-blue-300">
                    <span>Credit Balance</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </button>

                {/* 3. Withdraw Cash */}
                <button
                  id="btn-withdraw"
                  type="button"
                  onClick={() => {
                    setFormDescription('ATM Cash Withdrawal');
                    setActiveModal('WITHDRAW');
                  }}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-rose-500/70 p-5 sm:p-6 text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-rose-950/40 active:translate-y-0 active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/15 transition-all" />
                  <div>
                    <div className="flex items-center justify-between w-full mb-4">
                      <div className="w-13 h-13 rounded-2xl bg-rose-950/80 border border-rose-800/70 text-rose-400 flex items-center justify-center shadow-lg group-hover:bg-rose-500 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                        <ArrowUpRight className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-800/60 shadow-sm">
                        #03
                      </span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-white group-hover:text-rose-300 transition-colors">
                      Withdraw Cash
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                      Debit account balance with pin validation &amp; overdraft protection
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-rose-400 group-hover:text-rose-300">
                    <span>Debit Cash</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </button>

                {/* 4. Atomic Transfer */}
                <button
                  id="btn-transfer"
                  type="button"
                  onClick={() => {
                    setTransferFrom(currentAccount.accountNumber);
                    setActiveModal('TRANSFER');
                  }}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-amber-500/70 p-5 sm:p-6 text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-amber-950/40 active:translate-y-0 active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-all" />
                  <div>
                    <div className="flex items-center justify-between w-full mb-4">
                      <div className="w-13 h-13 rounded-2xl bg-amber-950/80 border border-amber-800/70 text-amber-400 flex items-center justify-center shadow-lg group-hover:bg-amber-400 group-hover:text-slate-950 group-hover:scale-110 transition-all duration-300">
                        <ArrowRightLeft className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-800/60 shadow-sm">
                        #04
                      </span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                      Atomic Transfer
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                      Instant fund transfer between sender &amp; recipient accounts
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
                    <span>Transfer Now</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </button>

                {/* 5. Balance Enquiry */}
                <button
                  id="btn-balance"
                  type="button"
                  onClick={() => {
                    setBalanceEnquiryInput(selectedAccNum);
                    setActiveModal('BALANCE_ENQUIRY');
                  }}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-sky-500/70 p-5 sm:p-6 text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-sky-950/40 active:translate-y-0 active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/15 transition-all" />
                  <div>
                    <div className="flex items-center justify-between w-full mb-4">
                      <div className="w-13 h-13 rounded-2xl bg-sky-950/80 border border-sky-800/70 text-sky-400 flex items-center justify-center shadow-lg group-hover:bg-sky-500 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                        <Eye className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/80 px-2.5 py-1 rounded-lg border border-sky-800/60 shadow-sm">
                        #05
                      </span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-white group-hover:text-sky-300 transition-colors">
                      Balance Enquiry
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                      Check real-time ledger balance &amp; account status with 1-click
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-sky-400 group-hover:text-sky-300">
                    <span>Enquire Balance</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </button>

                {/* 6. Mini Statement */}
                <button
                  id="btn-statement"
                  type="button"
                  onClick={() => {
                    setStatementSearchInput(selectedAccNum);
                    setActiveStatementAcc(selectedAccNum);
                    setActiveModal('MINI_STATEMENT');
                  }}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-purple-500/70 p-5 sm:p-6 text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-purple-950/40 active:translate-y-0 active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/15 transition-all" />
                  <div>
                    <div className="flex items-center justify-between w-full mb-4">
                      <div className="w-13 h-13 rounded-2xl bg-purple-950/80 border border-purple-800/70 text-purple-400 flex items-center justify-center shadow-lg group-hover:bg-purple-500 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                        <Clock className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-800/60 shadow-sm">
                        #06
                      </span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                      Mini Statement
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                      Lookup customer ledger &amp; view transaction history with credit/debit totals
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-purple-400 group-hover:text-purple-300">
                    <span>View Customer Statement</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </button>

                {/* 7. Apply Loan */}
                <button
                  id="btn-apply-loan"
                  type="button"
                  onClick={() => {
                    setLoanAccount(selectedAccNum);
                    setActiveModal('APPLY_LOAN');
                  }}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-indigo-500/70 p-5 sm:p-6 text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-950/40 active:translate-y-0 active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all" />
                  <div>
                    <div className="flex items-center justify-between w-full mb-4">
                      <div className="w-13 h-13 rounded-2xl bg-indigo-950/80 border border-indigo-800/70 text-indigo-400 flex items-center justify-center shadow-lg group-hover:bg-indigo-500 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-800/60 shadow-sm">
                        #07
                      </span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                      Apply for Loan
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                      Submit principal borrowing application with flexible tenure
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
                    <span>Submit Application</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </button>

                {/* 8. Search Customer */}
                <button
                  id="btn-search-user"
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchedUser(null);
                    setSearchHasExecuted(false);
                    setSearchErrorMessage('');
                    setActiveModal('SEARCH_USER');
                  }}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-cyan-500/70 p-5 sm:p-6 text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-cyan-950/40 active:translate-y-0 active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition-all" />
                  <div>
                    <div className="flex items-center justify-between w-full mb-4">
                      <div className="w-13 h-13 rounded-2xl bg-cyan-950/80 border border-cyan-800/70 text-cyan-400 flex items-center justify-center shadow-lg group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:scale-110 transition-all duration-300">
                        <Search className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800/60 shadow-sm">
                        Search
                      </span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                      Search Customer
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                      Lookup customer profile, balance, active loans, and transaction history
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                    <span>Lookup Customer Records</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </button>
              </div>
            </div>

            {/* Active Account Overview Card (Executive Tier Design - placed below buttons) */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/90 shadow-2xl p-6 sm:p-8 backdrop-blur-md">
              {/* Subtle ambient lighting effects */}
              <div className="absolute -right-24 -top-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-[2px] shadow-xl shadow-blue-500/20">
                    <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-blue-400 font-black text-2xl sm:text-3xl">
                      {currentAccount.holderName.charAt(0)}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950 shadow" title="Active Account" />
                  </div>
                  <div>
                    <div className="flex items-center flex-wrap gap-2.5">
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{currentAccount.holderName}</h2>
                      <span
                        className={`text-xs px-3.5 py-1 rounded-full font-mono font-bold tracking-wider uppercase border shadow-sm ${
                          currentAccount.accountType === 'SAVINGS'
                            ? 'bg-purple-950/80 text-purple-300 border-purple-800/80'
                            : 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                        }`}
                      >
                        {currentAccount.accountType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-400 mt-2">
                      <span className="font-mono bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 font-semibold text-slate-300">
                        Account No: #{currentAccount.accountNumber}
                      </span>
                      <button
                        onClick={() => copyToClipboard(currentAccount.accountNumber)}
                        className="text-slate-400 hover:text-white inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer text-xs"
                        title="Copy account number"
                      >
                        {copiedText === currentAccount.accountNumber ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account Switcher Manual Search & Switch Button */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const query = switchAccInput.trim();
                    if (!query) return;
                    const found = accounts.find(
                      (a) =>
                        a.accountNumber === query ||
                        a.holderName.toLowerCase() === query.toLowerCase()
                    );
                    if (found) {
                      setSelectedAccNum(found.accountNumber);
                      setSwitchAccInput('');
                      showToast('success', 'Account Switched', `Dashboard switched to #${found.accountNumber} (${found.holderName}).`);
                    } else {
                      showToast('error', 'Account Not Found', `No account found for "${query}". Enter a valid 4-digit number or name.`);
                    }
                  }}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Switch Acc # or Name..."
                      value={switchAccInput}
                      onChange={(e) => setSwitchAccInput(e.target.value)}
                      className="bg-slate-950/90 border border-slate-700/80 text-white rounded-xl px-4 py-3 text-xs sm:text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full placeholder:text-slate-500 shadow-inner"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
                  >
                    <Search className="w-4 h-4" /> Switch
                  </button>
                </form>
              </div>

              {/* Verified Account Balance Banner */}
              <div className="relative z-10 pt-6 flex flex-wrap items-end justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 uppercase tracking-widest font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Verified Account Balance
                  </div>
                  <div className="text-4xl sm:text-6xl font-black text-emerald-400 mt-2 font-mono tracking-tight drop-shadow-sm">
                    ${currentAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-400 mt-3 font-medium">
                    <span>Account Opened: <strong className="text-slate-200">{new Date(currentAccount.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ACCOUNTS */}
        {!isLoading && !loadError && activeTab === 'accounts' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" /> All Bank Accounts Directory
                </h2>
                <p className="text-xs text-slate-400">
                  Total {accounts.length} active customer accounts securely maintained in banking registry
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setActiveModal('OPEN_ACCOUNT')}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <Plus className="w-4 h-4" /> Open New Account
                </button>
                <button
                  onClick={handleReloadFromBackend}
                  title="Reload data from MongoDB database"
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search & Filter Bar for Accounts Tab */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search accounts by name or account number..."
                  value={accountFilterQuery}
                  onChange={(e) => setAccountFilterQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-20 py-2 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {accountFilterQuery && (
                    <button
                      type="button"
                      onClick={() => setAccountFilterQuery('')}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => document.querySelector<HTMLInputElement>('.account-search-input')?.focus()}
                    className="px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {(['ALL', 'SAVINGS', 'CURRENT'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      accountTypeFilter === type
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {type === 'ALL' ? `All (${accounts.length})` : type}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid for Accounts Tab */}
            {filteredAccounts.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 text-slate-400">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-semibold">No accounts found matching &quot;{accountFilterQuery}&quot;</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAccounts.map((acc) => {
                  const isActive = selectedAccNum === acc.accountNumber;
                  return (
                    <div
                      key={acc.accountNumber}
                      className={`rounded-2xl p-5 relative transition-all border ${
                        isActive
                          ? 'bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-950 border-blue-500 shadow-xl ring-1 ring-blue-500/50'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base shadow ${
                            acc.accountType === 'SAVINGS'
                              ? 'bg-gradient-to-tr from-purple-700 to-indigo-600 text-white'
                              : 'bg-gradient-to-tr from-amber-600 to-orange-500 text-white'
                          }`}>
                            {acc.holderName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-base text-white">{acc.holderName}</h3>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                  acc.accountType === 'SAVINGS'
                                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                                }`}
                              >
                                {acc.accountType}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs font-mono text-slate-400">#{acc.accountNumber}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(acc.accountNumber)}
                                className="text-slate-500 hover:text-slate-300 p-0.5"
                                title="Copy account number"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              {copiedText === acc.accountNumber && (
                                <span className="text-[10px] text-emerald-400 font-mono">Copied!</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {isActive && (
                          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-blue-400" /> Active
                          </span>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-400">Verified Balance</div>
                          <div className="text-xl font-black text-emerald-400 font-mono">
                            ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedAccNum(acc.accountNumber);
                              setActiveModal('DEPOSIT');
                            }}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 text-xs font-semibold"
                          >
                            Deposit
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAccNum(acc.accountNumber);
                              setActiveModal('WITHDRAW');
                            }}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 text-xs font-semibold"
                          >
                            Withdraw
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <button
                          onClick={() => {
                            setSelectedAccNum(acc.accountNumber);
                            setActiveTab('dashboard');
                          }}
                          className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          Select on Dashboard <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAccNum(acc.accountNumber);
                            setActiveStatementAcc(acc.accountNumber);
                            setActiveModal('MINI_STATEMENT');
                          }}
                          className="text-slate-400 hover:text-slate-200 text-[11px] flex items-center gap-1"
                        >
                          <Receipt className="w-3 h-3" /> View Statement
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= MODALS FOR EVERY BANKING FEATURE ================= */}

      {/* 1. OPEN ACCOUNT MODAL */}
      {activeModal === 'OPEN_ACCOUNT' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">1. Open Bank Account</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenAccountSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Account Holder Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robert Williams"
                  value={formHolderName}
                  onChange={(e) => setFormHolderName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormAccountType('SAVINGS')}
                      className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                        formAccountType === 'SAVINGS'
                          ? 'bg-purple-600 border-purple-500 text-white shadow'
                          : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      SAVINGS (4%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormAccountType('CURRENT')}
                      className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                        formAccountType === 'CURRENT'
                          ? 'bg-amber-600 border-amber-500 text-slate-950 font-bold shadow'
                          : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      CURRENT
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Deposit ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formInitialDeposit}
                    onChange={(e) => setFormInitialDeposit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Customer PIN (BCrypt Hashed)</label>
                <input
                  type="password"
                  value={formPin}
                  onChange={(e) => setFormPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Hashes via BCryptPasswordEncoder on backend</span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                >
                  Confirm &amp; Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. DEPOSIT MODAL */}
      {activeModal === 'DEPOSIT' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">2. Deposit Funds</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Account Number</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Enter target account number e.g. 1001"
                    value={selectedAccNum}
                    onChange={(e) => setSelectedAccNum(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                  />
                </div>
                {(() => {
                  const target = accounts.find((a) => a.accountNumber === selectedAccNum.trim());
                  return target ? (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                      <Check className="w-3 h-3" /> Target Account: {target.holderName} ({target.accountType})
                    </div>
                  ) : selectedAccNum.trim() ? (
                    <div className="mt-1.5 text-[11px] text-slate-400 font-mono">
                      Target Account #{selectedAccNum} will be credited upon confirmation.
                    </div>
                  ) : null;
                })()}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deposit Amount ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <div className="flex gap-2 mt-2">
                  {['100', '500', '1000', '5000'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormAmount(preset)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300"
                    >
                      +${preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Narration</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow"
                >
                  Credit Funds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. WITHDRAW MODAL */}
      {activeModal === 'WITHDRAW' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">3. Withdraw Funds</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Debiting Account Number</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Enter debiting account number e.g. 1001"
                    value={selectedAccNum}
                    onChange={(e) => setSelectedAccNum(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                  />
                </div>
                {(() => {
                  const debiting = accounts.find((a) => a.accountNumber === selectedAccNum.trim());
                  return debiting ? (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                      <Check className="w-3 h-3" /> Debiting Account: {debiting.holderName} ({debiting.accountType})
                    </div>
                  ) : selectedAccNum.trim() ? (
                    <div className="mt-1.5 text-[11px] text-slate-400 font-mono">
                      Debiting Account #{selectedAccNum} will be debited upon confirmation.
                    </div>
                  ) : null;
                })()}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Withdrawal Amount ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <span className="text-[11px] text-amber-400/90 mt-1 block">
                  Strict Overdraft Check: Rejects with 409 Conflict if amount exceeds balance.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Narration</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow"
                >
                  Debit Funds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. ATOMIC TRANSFER MODAL */}
      {activeModal === 'TRANSFER' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">4. Atomic Fund Transfer</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">From Sender Account Number</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter sender account e.g. 1001"
                    value={transferFrom}
                    onChange={(e) => setTransferFrom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                  />
                  {(() => {
                    const sender = accounts.find((a) => a.accountNumber === transferFrom.trim());
                    return sender ? (
                      <span className="text-[11px] text-emerald-400 mt-1 block font-mono">
                        Sender: {sender.holderName}
                      </span>
                    ) : null;
                  })()}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">To Recipient Account Number</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter recipient account e.g. 1002"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                  />
                  {(() => {
                    const recipient = accounts.find((a) => a.accountNumber === transferTo.trim());
                    return recipient ? (
                      <span className="text-[11px] text-emerald-400 mt-1 block font-mono">
                        Recipient: {recipient.holderName}
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Transfer Amount ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Transfer Remarks / Reference</label>
                <input
                  type="text"
                  value={transferRemarks}
                  onChange={(e) => setTransferRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold shadow"
                >
                  Execute Atomic Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. BALANCE ENQUIRY MODAL */}
      {activeModal === 'BALANCE_ENQUIRY' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">5. Balance Enquiry (Real-Time)</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Enter Account Number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 1001"
                    value={balanceEnquiryInput}
                    onChange={(e) => setBalanceEnquiryInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const found = accounts.find((a) => a.accountNumber === balanceEnquiryInput.trim());
                      if (found) {
                        showToast('success', 'Balance Verified', `Account #${found.accountNumber} balance loaded.`);
                      } else {
                        showToast('error', 'Account Not Found', `No account found for #${balanceEnquiryInput}.`);
                      }
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow flex items-center gap-1.5 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" /> Check
                  </button>
                </div>
              </div>

              {(() => {
                const targetAcc = accounts.find((a) => a.accountNumber === balanceEnquiryInput.trim());
                if (targetAcc) {
                  return (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-center">
                      <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Verified Real-Time Balance</div>
                      <div className="text-3xl font-black text-emerald-400 mt-2 font-mono">
                        ${targetAcc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-slate-400 mt-2">
                        Holder: <strong className="text-white">{targetAcc.holderName}</strong> &bull; {targetAcc.accountType}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 font-mono">
                        Account #{targetAcc.accountNumber} &bull; As of {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-center text-xs text-slate-400">
                    <AlertCircle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    Enter an account number above and click <strong>Check</strong> to verify balance.
                  </div>
                );
              })()}

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Close Enquiry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MINI STATEMENT MODAL */}
      {activeModal === 'MINI_STATEMENT' && (() => {
        const stmtAccount = accounts.find((a) => a.accountNumber === activeStatementAcc) || accounts[0];
        const userTxns = transactions.filter((t) => t.accountNumber === stmtAccount?.accountNumber);
        const totalCredits = userTxns
          .filter(
            (t) =>
              t.type === 'DEPOSIT' ||
              t.type === 'TRANSFER_IN' ||
              t.type === 'LOAN_DISBURSEMENT' ||
              t.type === 'INTEREST_CREDIT'
          )
          .reduce((sum, t) => sum + t.amount, 0);
        const totalDebits = userTxns
          .filter((t) => t.type === 'WITHDRAW' || t.type === 'TRANSFER_OUT' || t.type === 'LOAN_REPAYMENT')
          .reduce((sum, t) => sum + t.amount, 0);

        return (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-950 border border-purple-800 text-purple-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">6. Mini Statement Lookup</h3>
                    <p className="text-xs text-slate-400">Fetch specific customer account statement and ledger</p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Account Search Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = statementSearchInput.trim();
                  if (!q) return;
                  const match = accounts.find(
                    (a) => a.accountNumber === q || a.holderName.toLowerCase().includes(q.toLowerCase())
                  );
                  if (match) {
                    setActiveStatementAcc(match.accountNumber);
                    showToast('success', 'Statement Loaded', `Loaded statement for ${match.holderName} (#${match.accountNumber}).`);
                  } else {
                    showToast('error', 'Account Not Found', `No account found matching "${q}".`);
                  }
                }}
                className="mt-4 pb-3 border-b border-slate-800"
              >
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter Account Number or Customer Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={statementSearchInput}
                    onChange={(e) => setStatementSearchInput(e.target.value)}
                    placeholder="e.g. 1001 or John Doe..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500 placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow flex items-center gap-1.5 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" /> Fetch Statement
                  </button>
                </div>
              </form>

              {/* Statement Account Profile Header */}
              {stmtAccount ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 my-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{stmtAccount.holderName}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                            stmtAccount.accountType === 'SAVINGS'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {stmtAccount.accountType}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        Account #{stmtAccount.accountNumber}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400 uppercase font-semibold">Current Balance</div>
                      <div className="text-base font-bold text-emerald-400 font-mono">
                        ${stmtAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px]">
                    <div className="text-slate-400">
                      Total Credits: <span className="font-mono text-emerald-400 font-bold">+${totalCredits.toFixed(2)}</span>
                    </div>
                    <div className="text-slate-400">
                      Total Debits: <span className="font-mono text-rose-400 font-bold">-${totalDebits.toFixed(2)}</span>
                    </div>
                    <div className="text-slate-400 text-right">
                      Records: <span className="font-mono text-white font-bold">{userTxns.length} txns</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Transactions List */}
              <div className="text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Recent Transactions Ledger (Last 10)</span>
                <span className="text-[11px] text-slate-500 font-normal">Sorted chronologically by newest</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1">
                {userTxns.length === 0 ? (
                  <div className="text-xs text-slate-500 py-10 text-center border border-dashed border-slate-800 rounded-xl">
                    No transactions recorded for this customer account yet.
                  </div>
                ) : (
                  userTxns.slice(0, 10).map((txn) => {
                    const isCredit =
                      txn.type === 'DEPOSIT' ||
                      txn.type === 'TRANSFER_IN' ||
                      txn.type === 'LOAN_DISBURSEMENT' ||
                      txn.type === 'INTEREST_CREDIT';

                    return (
                      <div
                        key={txn.transactionId}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs flex justify-between items-center"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                isCredit
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800'
                              }`}
                            >
                              {txn.type}
                            </span>
                            <span className="text-white font-medium">{txn.description}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-1">
                            Ref: {txn.transactionId} &bull; Bal After: ${txn.balanceAfter.toFixed(2)} &bull; {new Date(txn.timestamp).toLocaleDateString()} {new Date(txn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className={`font-mono font-bold text-sm ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isCredit ? '+' : '-'}${txn.amount.toFixed(2)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  Close Statement
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 7. APPLY LOAN MODAL */}
      {activeModal === 'APPLY_LOAN' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">7. Apply for Loan</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLoanSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Borrower Account Number</label>
                <input
                  type="text"
                  required
                  placeholder="Enter borrower account # e.g. 1001"
                  value={loanAccount}
                  onChange={(e) => setLoanAccount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                />
                {(() => {
                  const borrower = accounts.find((a) => a.accountNumber === loanAccount.trim());
                  return borrower ? (
                    <span className="text-[11px] text-emerald-400 mt-1 block font-mono">
                      Borrower: {borrower.holderName} ({borrower.accountType})
                    </span>
                  ) : loanAccount.trim() ? (
                    <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                      Account #{loanAccount} will be verified on application submission.
                    </span>
                  ) : null;
                })()}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Loan Principal Amount ($)</label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  required
                  value={loanPrincipal}
                  onChange={(e) => setLoanPrincipal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tenure (Months)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={loanTenure}
                    onChange={(e) => setLoanTenure(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Annual Interest Rate</label>
                  <input
                    type="number"
                    min="0.01"
                    max="0.5"
                    step="0.005"
                    value={loanCustomRate}
                    onChange={(e) => setLoanCustomRate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPAY LOAN MODAL */}
      {activeModal === 'REPAY_LOAN' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Repay Loan Installment</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRepayLoanSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Loan ID</label>
                <input
                  type="text"
                  required
                  placeholder="Enter Loan ID e.g. LN-1002"
                  value={selectedLoanId}
                  onChange={(e) => setSelectedLoanId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                />
                {(() => {
                  const targetLoan = loans.find((l) => l.loanId.toLowerCase() === selectedLoanId.trim().toLowerCase());
                  return targetLoan ? (
                    <span className="text-[11px] text-emerald-400 mt-1 block font-mono">
                      Loan Match: #{targetLoan.accountNumber} &bull; Status: {targetLoan.status} &bull; Outstanding: ${targetLoan.outstandingBalance.toFixed(2)}
                    </span>
                  ) : selectedLoanId.trim() ? (
                    <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                      Target loan {selectedLoanId} will be validated on submission.
                    </span>
                  ) : null;
                })()}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Installment Amount ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Uses Reducing Balance Method: computes monthly interest on remaining principal, deducts balance, debits borrower account.
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow"
                >
                  Submit Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEARCH USER MODAL */}
      {activeModal === 'SEARCH_USER' && (() => {
        const inspectedAccount = searchedUser;
        const userLoans = inspectedAccount ? loans.filter((l) => l.accountNumber === inspectedAccount.accountNumber) : [];
        const userTransactions = inspectedAccount
          ? transactions.filter((t) => t.accountNumber === inspectedAccount.accountNumber)
          : [];

        const executeSearch = () => {
          const q = searchQuery.trim().toLowerCase();
          setSearchHasExecuted(true);
          if (!q) {
            setSearchedUser(null);
            setSearchErrorMessage('Please enter an Account ID or Customer Name.');
            return;
          }
          const match = accounts.find(
            (a) => a.accountNumber.toLowerCase() === q || a.holderName.toLowerCase().includes(q)
          );
          if (match) {
            setSearchedUser(match);
            setSearchErrorMessage('');
          } else {
            setSearchedUser(null);
            setSearchErrorMessage(`No customer account found matching "${searchQuery}".`);
          }
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-sky-950 border border-sky-800 text-sky-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Search Bank User</h3>
                    <p className="text-xs text-slate-400">Search customer by ID or Name to view details, loans &amp; history</p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Form with button underneath input box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  executeSearch();
                }}
                className="mt-4 space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Enter Account ID or Customer Name
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. 1001 or John Doe..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-12 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 placeholder:text-slate-500 font-mono"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSearchedUser(null);
                          setSearchHasExecuted(false);
                          setSearchErrorMessage('');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1.5 py-0.5"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Button directly underneath input box */}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" /> Search User
                </button>
              </form>

              {/* Initial State before search */}
              {!searchHasExecuted && !inspectedAccount && (
                <div className="mt-6 py-10 text-center border border-dashed border-slate-800 rounded-xl p-6 bg-slate-950/50">
                  <div className="w-12 h-12 rounded-full bg-sky-950 border border-sky-800 text-sky-400 flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Search Customer Profile</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Enter an Account ID or Customer Name above and click <strong>Search User</strong> to load complete profile data, active loans, and ledger activity.
                  </p>
                </div>
              )}

              {/* Error State if search executed and no user found */}
              {searchHasExecuted && !inspectedAccount && (
                <div className="mt-6 text-center py-8 bg-slate-950 rounded-xl border border-slate-800 p-6">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-300 font-medium">No account found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {searchErrorMessage || `No matching customer account found for "${searchQuery}".`}
                  </p>
                </div>
              )}

              {/* Complete User Details Section */}
              {inspectedAccount && (
                <div className="mt-5 space-y-4">
                  {/* Customer Overview Card */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white font-bold text-base shadow">
                          {inspectedAccount.holderName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-white">{inspectedAccount.holderName}</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              ACTIVE
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                              {inspectedAccount.accountType}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono text-slate-400">Account #{inspectedAccount.accountNumber}</span>
                            <button
                              onClick={() => copyToClipboard(inspectedAccount.accountNumber)}
                              className="text-slate-400 hover:text-white p-0.5"
                              title="Copy Account Number"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Available Balance</span>
                        <span className="text-xl font-black text-emerald-400 font-mono">
                          ${inspectedAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Detailed Attribute Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-1 text-xs">
                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="text-[11px] text-slate-400 block">Account Type</span>
                        <span className="font-semibold text-white mt-0.5 block">{inspectedAccount.accountType}</span>
                      </div>
                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="text-[11px] text-slate-400 block">Annual Interest</span>
                        <span className="font-semibold text-white mt-0.5 block">
                          {(inspectedAccount.interestRate * 100).toFixed(1)}% p.a.
                        </span>
                      </div>
                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="text-[11px] text-slate-400 block">Created On</span>
                        <span className="font-mono text-slate-300 mt-0.5 block text-[11px]">
                          {new Date(inspectedAccount.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="text-[11px] text-slate-400 block">Security Hash</span>
                        <span className="font-mono text-emerald-400 mt-0.5 block text-[11px]">BCrypt Protected</span>
                      </div>
                    </div>

                    {/* Quick Action Buttons for This User */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-400 mr-1">Quick Actions:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAccNum(inspectedAccount.accountNumber);
                          setActiveModal('DEPOSIT');
                        }}
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1"
                      >
                        <ArrowDownLeft className="w-3 h-3" /> Deposit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAccNum(inspectedAccount.accountNumber);
                          setActiveModal('WITHDRAW');
                        }}
                        className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1"
                      >
                        <ArrowUpRight className="w-3 h-3" /> Withdraw
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTransferFrom(inspectedAccount.accountNumber);
                          setActiveModal('TRANSFER');
                        }}
                        className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1"
                      >
                        <ArrowRightLeft className="w-3 h-3" /> Transfer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoanAccount(inspectedAccount.accountNumber);
                          setActiveModal('APPLY_LOAN');
                        }}
                        className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3 h-3" /> Apply Loan
                      </button>
                    </div>
                  </div>

                  {/* Associated Loans Card */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                      Associated Loan Accounts ({userLoans.length})
                    </h5>
                    {userLoans.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No active or applied loans found for this customer.</p>
                    ) : (
                      <div className="space-y-2">
                        {userLoans.map((loan) => (
                          <div
                            key={loan.loanId}
                            className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex flex-wrap justify-between items-center text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-white">{loan.loanId}</span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    loan.status === 'ACTIVE'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                                  }`}
                                >
                                  {loan.status}
                                </span>
                              </div>
                              <span className="text-slate-400 text-[11px] block mt-0.5">
                                Tenure: {loan.tenureMonths} mos &bull; Annual Rate: {(loan.interestRate * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-400 text-[11px] block">Outstanding Balance</span>
                              <span className="font-bold text-emerald-400 font-mono text-sm">
                                ${loan.outstandingBalance.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Customer Transaction Activity */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      Account Transaction Activity ({userTransactions.length})
                    </h5>
                    {userTransactions.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No recorded transactions for this account yet.</p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-1.5">
                        {userTransactions.map((txn) => {
                          const isCredit =
                            txn.type === 'DEPOSIT' ||
                            txn.type === 'TRANSFER_IN' ||
                            txn.type === 'LOAN_DISBURSEMENT' ||
                            txn.type === 'INTEREST_CREDIT';
                          return (
                            <div
                              key={txn.transactionId}
                              className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 flex justify-between items-center text-xs font-mono"
                            >
                              <div>
                                <span className="text-white font-sans font-medium">{txn.description}</span>
                                <span className="text-[10px] text-slate-500 block font-sans">
                                  {new Date(txn.timestamp).toLocaleString()} &bull; {txn.transactionId}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className={`font-bold ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {isCredit ? '+' : '-'}${txn.amount.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-slate-400 block">Bal: ${txn.balanceAfter.toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
