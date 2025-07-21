import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { budgetStorage } from '@/lib/localStorage';

export interface BudgetConfig {
  id: string;
  user_id: string;
  profile_name: string;
  budget_month: number;
  budget_year: number;
  monthly_salary: number;
  budget_percentage: number;
  allocation_need: number;
  allocation_want: number;
  allocation_savings: number;
  allocation_investments: number;
  created_at: string;
  updated_at: string;
}

export interface InvestmentPortfolio {
  id: string;
  user_id: string;
  profile_name: string;
  budget_month: number;
  budget_year: number;
  name: string;
  allocation_type: 'percentage' | 'amount';
  allocation_value: number;
  allocated_amount: number;
  invested_amount: number;
  allow_direct_investment: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: InvestmentCategory[];
}

export interface InvestmentCategory {
  id: string;
  portfolio_id: string;
  user_id: string;
  profile_name: string;
  budget_period_id: string | null;
  budget_year: number;
  budget_month: number;
  name: string;
  allocation_type: 'percentage' | 'amount';
  allocation_value: number;
  allocated_amount: number;
  invested_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  funds?: InvestmentFund[];
}

export interface InvestmentFund {
  id: string;
  category_id: string;
  user_id: string;
  profile_name: string;
  budget_period_id: string | null;
  budget_year: number;
  budget_month: number;
  name: string;
  allocated_amount: number;
  invested_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  profile_name: string;
  budget_month: number;
  budget_year: number;
  type: 'expense' | 'income' | 'refund' | 'investment' | 'savings' | 'transfer';
  category: 'need' | 'want' | 'savings' | 'investments' | 'unplanned';
  amount: number;
  description?: string;
  notes?: string;
  transaction_date: string;
  transaction_time?: string;
  payment_type?: 'cash' | 'card' | 'upi' | 'netbanking' | 'cheque' | 'other';
  spent_for?: string;
  tag?: string;
  portfolio_id?: string;
  investment_type?: string;
  refund_for?: string;
  original_transaction_id?: string;
  status: 'active' | 'cancelled' | 'refunded' | 'partial_refund';
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// Generate UUID
function generateId(): string {
  return crypto.randomUUID();
}

export function useBudgetData(month: number, year: number, profileName: string) {
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig | null>(null);
  const [portfolios, setPortfolios] = useState<InvestmentPortfolio[]>([]);
  const [categories, setCategories] = useState<InvestmentCategory[]>([]);
  const [funds, setFunds] = useState<InvestmentFund[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchBudgetData = async () => {
    if (!user || !profileName) {
      setBudgetConfig(null);
      setPortfolios([]);
      setCategories([]);
      setFunds([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching budget data for:', { user: user.id, profileName, month, year });

      // Load budget config from local storage
      const budgetData = budgetStorage.load(user.id, 'config', profileName, month, year);
      console.log('Fetched budget config:', budgetData);
      setBudgetConfig(budgetData);

      // Load investment portfolios from local storage
      const portfolioData = budgetStorage.load(user.id, 'portfolios', profileName, month, year) || [];
      console.log('Fetched portfolios:', portfolioData);

      // Load investment categories from local storage
      const categoryData = budgetStorage.load(user.id, 'categories', profileName, month, year) || [];
      console.log('Fetched categories:', categoryData);
      setCategories(categoryData);

      // Load investment funds from local storage
      const fundData = budgetStorage.load(user.id, 'funds', profileName, month, year) || [];
      console.log('Fetched funds:', fundData);
      setFunds(fundData);

      // Build nested portfolio structure
      const portfoliosWithCategories = portfolioData.map((portfolio: InvestmentPortfolio) => {
        const portfolioCategories = categoryData
          .filter((cat: InvestmentCategory) => cat.portfolio_id === portfolio.id)
          .map((category: InvestmentCategory) => ({
            ...category,
            funds: fundData.filter((fund: InvestmentFund) => fund.category_id === category.id)
          }));

        return {
          ...portfolio,
          categories: portfolioCategories
        };
      });

      setPortfolios(portfoliosWithCategories);

      // Load transactions from local storage
      const transactionData = budgetStorage.load(user.id, 'transactions', profileName, month, year) || [];
      console.log('Fetched transactions:', transactionData);
      
      // Filter active transactions and sort by date
      const activeTransactions = transactionData
        .filter((t: Transaction) => !t.is_deleted)
        .sort((a: Transaction, b: Transaction) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
      
      setTransactions(activeTransactions);
    } catch (err) {
      console.error('Fetch budget data error:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        user: user?.id,
        profileName,
        month,
        year,
      });
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const saveBudgetConfig = async (config: Partial<BudgetConfig>) => {
    if (!user || !profileName) return;

    try {
      console.log('Saving budget config:', { user: user.id, profileName, month, year, config });
      
      const now = new Date().toISOString();
      const budgetData: BudgetConfig = {
        id: budgetConfig?.id || generateId(),
        user_id: user.id,
        profile_name: profileName,
        budget_month: month,
        budget_year: year,
        monthly_salary: config.monthly_salary || 0,
        budget_percentage: config.budget_percentage || 100,
        allocation_need: config.allocation_need || 0,
        allocation_want: config.allocation_want || 0,
        allocation_savings: config.allocation_savings || 0,
        allocation_investments: config.allocation_investments || 0,
        created_at: budgetConfig?.created_at || now,
        updated_at: now,
      };

      console.log('Budget data to save:', budgetData);

      // Save to local storage
      budgetStorage.save(user.id, 'config', profileName, month, year, budgetData);
      
      console.log('Budget config saved successfully:', budgetData);
      setBudgetConfig(budgetData);
      return budgetData;
    } catch (err) {
      console.error('Save budget config error:', err);
      throw err;
    }
  };

  const saveInvestmentPortfolio = async (portfolio: Partial<InvestmentPortfolio>) => {
    if (!user || !profileName) return;

    try {
      const now = new Date().toISOString();
      const portfolioData: InvestmentPortfolio = {
        ...portfolio,
        id: generateId(),
        user_id: user.id,
        profile_name: profileName,
        budget_month: month,
        budget_year: year,
        created_at: now,
        updated_at: now,
      } as InvestmentPortfolio;

      // Load existing portfolios and add new one
      const existingPortfolios = budgetStorage.load(user.id, 'portfolios', profileName, month, year) || [];
      const updatedPortfolios = [...existingPortfolios, portfolioData];
      
      // Save to local storage
      budgetStorage.save(user.id, 'portfolios', profileName, month, year, updatedPortfolios);
      
      setPortfolios(prev => [...prev, portfolioData]);
      return portfolioData;
    } catch (err) {
      throw err;
    }
  };

  const updateInvestmentPortfolio = async (id: string, updates: Partial<InvestmentPortfolio>) => {
    if (!user || !profileName) return;

    try {
      const now = new Date().toISOString();
      const existingPortfolios = budgetStorage.load(user.id, 'portfolios', profileName, month, year) || [];
      const updatedPortfolios = existingPortfolios.map((p: InvestmentPortfolio) => 
        p.id === id ? { ...p, ...updates, updated_at: now } : p
      );
      
      // Save to local storage
      budgetStorage.save(user.id, 'portfolios', profileName, month, year, updatedPortfolios);
      
      const updatedPortfolio = updatedPortfolios.find((p: InvestmentPortfolio) => p.id === id);
      setPortfolios(prev => prev.map(p => p.id === id ? updatedPortfolio : p));
      return updatedPortfolio;
    } catch (err) {
      throw err;
    }
  };

  const deleteInvestmentPortfolio = async (id: string) => {
    if (!user || !profileName) return;

    try {
      const existingPortfolios = budgetStorage.load(user.id, 'portfolios', profileName, month, year) || [];
      const updatedPortfolios = existingPortfolios.filter((p: InvestmentPortfolio) => p.id !== id);
      
      // Save to local storage
      budgetStorage.save(user.id, 'portfolios', profileName, month, year, updatedPortfolios);
      
      setPortfolios(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      throw err;
    }
  };

  const addTransaction = async (transaction: Partial<Transaction>) => {
    if (!user || !profileName) return;

    // Validate month and year values
    if (!month || !year || month < 1 || month > 12 || year < 2020 || year > 3000) {
      const error = new Error(`Invalid month/year values: month=${month}, year=${year}`);
      console.error('addTransaction validation failed:', {
        month,
        year,
        profileName,
        user: user.id
      });
      throw error;
    }

    console.log('addTransaction called with:', {
      month,
      year,
      profileName,
      user: user.id,
      transaction: transaction
    });

    try {
      const now = new Date().toISOString();
      const transactionData: Transaction = {
        ...transaction,
        id: generateId(),
        user_id: user.id,
        profile_name: profileName,
        budget_month: month,
        budget_year: year,
        transaction_date: transaction.transaction_date || new Date().toISOString().split('T')[0],
        status: transaction.status || 'active',
        is_deleted: false,
        created_at: now,
        updated_at: now,
      } as Transaction;

      console.log('Transaction data to insert:', transactionData);

      // Load existing transactions and add new one
      const existingTransactions = budgetStorage.load(user.id, 'transactions', profileName, month, year) || [];
      const updatedTransactions = [transactionData, ...existingTransactions];
      
      // Save to local storage
      budgetStorage.save(user.id, 'transactions', profileName, month, year, updatedTransactions);
      
      setTransactions(prev => [transactionData, ...prev]);
      return transactionData;
    } catch (err) {
      console.error('addTransaction error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        user: user.id,
        profileName,
        month,
        year,
        transactionData: JSON.stringify(transaction, null, 2)
      });
      throw err;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user || !profileName) return;

    try {
      const now = new Date().toISOString();
      const existingTransactions = budgetStorage.load(user.id, 'transactions', profileName, month, year) || [];
      const updatedTransactions = existingTransactions.map((t: Transaction) => 
        t.id === id ? { ...t, ...updates, updated_at: now } : t
      );
      
      // Save to local storage
      budgetStorage.save(user.id, 'transactions', profileName, month, year, updatedTransactions);
      
      const updatedTransaction = updatedTransactions.find((t: Transaction) => t.id === id);
      setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));
      return updatedTransaction;
    } catch (err) {
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user || !profileName) return;

    try {
      const now = new Date().toISOString();
      const existingTransactions = budgetStorage.load(user.id, 'transactions', profileName, month, year) || [];
      const updatedTransactions = existingTransactions.map((t: Transaction) => 
        t.id === id ? { ...t, is_deleted: true, deleted_at: now, updated_at: now } : t
      );
      
      // Save to local storage
      budgetStorage.save(user.id, 'transactions', profileName, month, year, updatedTransactions);
      
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      throw err;
    }
  };

  const refundTransaction = async (originalTransactionId: string, refundAmount: number, reason: string) => {
    if (!user || !profileName) return;

    try {
      const now = new Date().toISOString();
      
      // Create refund transaction
      const refundData: Transaction = {
        id: generateId(),
        user_id: user.id,
        profile_name: profileName,
        budget_month: month,
        budget_year: year,
        type: 'refund',
        category: 'need', // Will be updated based on original transaction
        amount: refundAmount,
        description: `Refund: ${reason}`,
        transaction_date: new Date().toISOString().split('T')[0],
        refund_for: originalTransactionId,
        status: 'active',
        is_deleted: false,
        created_at: now,
        updated_at: now,
      };

      // Load existing transactions
      const existingTransactions = budgetStorage.load(user.id, 'transactions', profileName, month, year) || [];
      
      // Update original transaction status
      const originalTransaction = existingTransactions.find((t: Transaction) => t.id === originalTransactionId);
      const updatedTransactions = existingTransactions.map((t: Transaction) => {
        if (t.id === originalTransactionId) {
          return {
            ...t,
            status: refundAmount === t.amount ? 'refunded' : 'partial_refund',
            updated_at: now
          };
        }
        return t;
      });

      // Add refund transaction
      updatedTransactions.unshift(refundData);
      
      // Save to local storage
      budgetStorage.save(user.id, 'transactions', profileName, month, year, updatedTransactions);

      // Refresh data
      await fetchBudgetData();
      return refundData;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [user, month, year, profileName]);

  const deleteBudgetConfig = async () => {
    if (!user || !profileName) return;

    try {
      budgetStorage.remove(user.id, 'config', profileName, month, year);
      setBudgetConfig(null);
    } catch (err) {
      throw err;
    }
  };

  const deleteAllInvestmentPortfolios = async () => {
    if (!user || !profileName) return;

    try {
      budgetStorage.remove(user.id, 'portfolios', profileName, month, year);
      budgetStorage.remove(user.id, 'categories', profileName, month, year);
      budgetStorage.remove(user.id, 'funds', profileName, month, year);

      setPortfolios([]);
      setCategories([]);
      setFunds([]);
    } catch (err) {
      throw err;
    }
  };

  const deleteAllTransactions = async () => {
    if (!user || !profileName) return;

    try {
      budgetStorage.remove(user.id, 'transactions', profileName, month, year);
      setTransactions([]);
    } catch (err) {
      throw err;
    }
  };

  return {
    budgetConfig,
    portfolios,
    categories,
    funds,
    transactions,
    loading,
    error,
    saveBudgetConfig,
    saveInvestmentPortfolio,
    updateInvestmentPortfolio,
    deleteInvestmentPortfolio,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refundTransaction,
    deleteBudgetConfig,
    deleteAllInvestmentPortfolios,
    deleteAllTransactions,
    refetch: fetchBudgetData
  };
}
