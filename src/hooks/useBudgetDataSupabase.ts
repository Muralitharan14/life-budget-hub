import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Tables = Database['public']['Tables'];
type UserProfile = Tables['user_profiles']['Row'];
type BudgetPeriod = Tables['budget_periods']['Row'];
type BudgetModule = Tables['budget_modules']['Row'];
type BudgetConfig = Tables['budget_configs']['Row'];
type BudgetAllocation = Tables['budget_allocations']['Row'];
type InvestmentPortfolio = Tables['investment_portfolios']['Row'];
type InvestmentCategory = Tables['investment_categories']['Row'];
type InvestmentFund = Tables['investment_funds']['Row'];
type Transaction = Tables['transactions']['Row'];
type BankAccount = Tables['bank_accounts']['Row'];
type BankBalance = Tables['bank_balances']['Row'];

interface BudgetConfigWithAllocations extends BudgetConfig {
  allocations: (BudgetAllocation & { module: BudgetModule })[];
}

interface InvestmentPortfolioWithNested extends InvestmentPortfolio {
  categories: (InvestmentCategory & { funds: InvestmentFund[] })[];
}

interface BudgetData {
  profile: UserProfile | null;
  budgetPeriod: BudgetPeriod | null;
  budgetConfig: BudgetConfigWithAllocations | null;
  modules: BudgetModule[];
  portfolios: InvestmentPortfolioWithNested[];
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  bankBalances: BankBalance[];
}

export function useBudgetData(profileId: string, month: number, year: number) {
  const [data, setData] = useState<BudgetData>({
    profile: null,
    budgetPeriod: null,
    budgetConfig: null,
    modules: [],
    portfolios: [],
    transactions: [],
    bankAccounts: [],
    bankBalances: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch all budget data for the specified profile and period
  const fetchBudgetData = async () => {
    if (!user || !profileId) {
      setData({
        profile: null,
        budgetPeriod: null,
        budgetConfig: null,
        modules: [],
        portfolios: [],
        transactions: [],
        bankAccounts: [],
        bankBalances: []
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching budget data for:', { userId: user.id, profileId, month, year });

      // 1. Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', profileId)
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        throw new Error(`Profile not found: ${profileError.message}`);
      }

      // 2. Get or create budget period
      let budgetPeriod = await getOrCreateBudgetPeriod(user.id, profileId, month, year);

      // 3. Get budget modules for this user
      const { data: modules, error: modulesError } = await supabase
        .from('budget_modules')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('sort_order');

      if (modulesError) {
        throw new Error(`Failed to fetch modules: ${modulesError.message}`);
      }

      // 4. Get budget config with allocations
      const budgetConfig = await getBudgetConfigWithAllocations(user.id, profileId, budgetPeriod.id);

      // 5. Get investment portfolios with nested data
      const portfolios = await getInvestmentPortfoliosWithNested(user.id, profileId, budgetPeriod.id);

      // 6. Get transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .eq('budget_period_id', budgetPeriod.id)
        .eq('is_deleted', false)
        .order('transaction_date', { ascending: false });

      if (transactionsError) {
        throw new Error(`Failed to fetch transactions: ${transactionsError.message}`);
      }

      // 7. Get bank accounts
      const { data: bankAccounts, error: bankAccountsError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .eq('is_active', true);

      if (bankAccountsError) {
        throw new Error(`Failed to fetch bank accounts: ${bankAccountsError.message}`);
      }

      // 8. Get bank balances for this period
      const { data: bankBalances, error: bankBalancesError } = await supabase
        .from('bank_balances')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .eq('budget_period_id', budgetPeriod.id);

      if (bankBalancesError) {
        throw new Error(`Failed to fetch bank balances: ${bankBalancesError.message}`);
      }

      setData({
        profile,
        budgetPeriod,
        budgetConfig,
        modules: modules || [],
        portfolios,
        transactions: transactions || [],
        bankAccounts: bankAccounts || [],
        bankBalances: bankBalances || []
      });

    } catch (err) {
      console.error('Fetch budget data error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get or create budget period
  const getOrCreateBudgetPeriod = async (userId: string, profileId: string, month: number, year: number): Promise<BudgetPeriod> => {
    // Try to get existing period
    const { data: existingPeriod, error: fetchError } = await supabase
      .from('budget_periods')
      .select('*')
      .eq('user_id', userId)
      .eq('profile_id', profileId)
      .eq('budget_month', month)
      .eq('budget_year', year)
      .single();

    if (existingPeriod) return existingPeriod;

    // Create new period if it doesn't exist
    const { data: newPeriod, error: createError } = await supabase
      .from('budget_periods')
      .insert({
        user_id: userId,
        profile_id: profileId,
        budget_month: month,
        budget_year: year,
        is_active: true
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create budget period: ${createError.message}`);
    }

    return newPeriod;
  };

  // Helper function to get budget config with allocations
  const getBudgetConfigWithAllocations = async (userId: string, profileId: string, budgetPeriodId: string): Promise<BudgetConfigWithAllocations | null> => {
    const { data: budgetConfig, error: configError } = await supabase
      .from('budget_configs')
      .select(`
        *,
        allocations:budget_allocations(
          *,
          module:budget_modules(*)
        )
      `)
      .eq('user_id', userId)
      .eq('profile_id', profileId)
      .eq('budget_period_id', budgetPeriodId)
      .single();

    if (configError && configError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch budget config: ${configError.message}`);
    }

    return budgetConfig as BudgetConfigWithAllocations || null;
  };

  // Helper function to get investment portfolios with nested data
  const getInvestmentPortfoliosWithNested = async (userId: string, profileId: string, budgetPeriodId: string): Promise<InvestmentPortfolioWithNested[]> => {
    const { data: portfolios, error: portfoliosError } = await supabase
      .from('investment_portfolios')
      .select(`
        *,
        categories:investment_categories(
          *,
          funds:investment_funds(*)
        )
      `)
      .eq('user_id', userId)
      .eq('profile_id', profileId)
      .eq('budget_period_id', budgetPeriodId)
      .eq('is_active', true);

    if (portfoliosError) {
      throw new Error(`Failed to fetch investment portfolios: ${portfoliosError.message}`);
    }

    return portfolios as InvestmentPortfolioWithNested[] || [];
  };

  // Save budget configuration
  const saveBudgetConfig = async (config: {
    monthly_salary: number;
    budget_percentage: number;
    allocations: { module_id: string; percentage: number }[];
  }) => {
    if (!user || !data.profile || !data.budgetPeriod) return;

    try {
      const totalBudgetAmount = (config.monthly_salary * config.budget_percentage) / 100;

      // Save or update budget config
      const { data: savedConfig, error: configError } = await supabase
        .from('budget_configs')
        .upsert({
          user_id: user.id,
          profile_id: data.profile.id,
          budget_period_id: data.budgetPeriod.id,
          monthly_salary: config.monthly_salary,
          budget_percentage: config.budget_percentage,
          total_budget_amount: totalBudgetAmount
        })
        .select()
        .single();

      if (configError) throw configError;

      // Delete existing allocations
      await supabase
        .from('budget_allocations')
        .delete()
        .eq('budget_config_id', savedConfig.id);

      // Save new allocations
      const allocations = config.allocations.map(alloc => ({
        budget_config_id: savedConfig.id,
        budget_module_id: alloc.module_id,
        allocation_percentage: alloc.percentage,
        allocated_amount: (totalBudgetAmount * alloc.percentage) / 100
      }));

      const { error: allocationsError } = await supabase
        .from('budget_allocations')
        .insert(allocations);

      if (allocationsError) throw allocationsError;

      // Refresh data
      await fetchBudgetData();
      return savedConfig;
    } catch (err) {
      console.error('Save budget config error:', err);
      throw err;
    }
  };

  // Save investment portfolio
  const saveInvestmentPortfolio = async (portfolio: Omit<InvestmentPortfolio, 'id' | 'user_id' | 'profile_id' | 'budget_period_id' | 'created_at' | 'updated_at'>) => {
    if (!user || !data.profile || !data.budgetPeriod) return;

    try {
      const { data: savedPortfolio, error } = await supabase
        .from('investment_portfolios')
        .insert({
          ...portfolio,
          user_id: user.id,
          profile_id: data.profile.id,
          budget_period_id: data.budgetPeriod.id
        })
        .select()
        .single();

      if (error) throw error;

      await fetchBudgetData();
      return savedPortfolio;
    } catch (err) {
      console.error('Save investment portfolio error:', err);
      throw err;
    }
  };

  // Add transaction
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'profile_id' | 'budget_period_id' | 'created_at' | 'updated_at'>) => {
    if (!user || !data.profile || !data.budgetPeriod) return;

    try {
      const { data: savedTransaction, error } = await supabase
        .from('transactions')
        .insert({
          ...transaction,
          user_id: user.id,
          profile_id: data.profile.id,
          budget_period_id: data.budgetPeriod.id
        })
        .select()
        .single();

      if (error) throw error;

      await fetchBudgetData();
      return savedTransaction;
    } catch (err) {
      console.error('Add transaction error:', err);
      throw err;
    }
  };

  // Update transaction
  const updateTransaction = async (transactionId: string, updates: Partial<Transaction>) => {
    if (!user) return;

    try {
      const { data: updatedTransaction, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', transactionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      await fetchBudgetData();
      return updatedTransaction;
    } catch (err) {
      console.error('Update transaction error:', err);
      throw err;
    }
  };

  // Delete transaction (soft delete)
  const deleteTransaction = async (transactionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString() 
        })
        .eq('id', transactionId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchBudgetData();
    } catch (err) {
      console.error('Delete transaction error:', err);
      throw err;
    }
  };

  // Create budget module
  const createBudgetModule = async (moduleName: string, displayName: string, includeInBudget: boolean = true) => {
    if (!user) return;

    try {
      // Get the highest sort_order
      const { data: modules } = await supabase
        .from('budget_modules')
        .select('sort_order')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextSortOrder = (modules?.[0]?.sort_order || 0) + 1;

      const { data: newModule, error } = await supabase
        .from('budget_modules')
        .insert({
          user_id: user.id,
          module_name: moduleName,
          display_name: displayName,
          include_in_budget: includeInBudget,
          is_system_module: false,
          sort_order: nextSortOrder
        })
        .select()
        .single();

      if (error) throw error;

      await fetchBudgetData();
      return newModule;
    } catch (err) {
      console.error('Create budget module error:', err);
      throw err;
    }
  };

  // Inherit configuration from another period
  const inheritConfiguration = async (sourcePeriodId: string, components: string[]) => {
    if (!user || !data.profile || !data.budgetPeriod) return;

    try {
      // Record the inheritance
      await supabase
        .from('configuration_inheritances')
        .insert({
          user_id: user.id,
          profile_id: data.profile.id,
          source_budget_period_id: sourcePeriodId,
          target_budget_period_id: data.budgetPeriod.id,
          inherited_components: components
        });

      // Implement inheritance logic based on components
      if (components.includes('budget_config')) {
        // Copy budget config and allocations
        const { data: sourceBudgetConfig } = await supabase
          .from('budget_configs')
          .select('*, allocations:budget_allocations(*)')
          .eq('budget_period_id', sourcePeriodId)
          .single();

        if (sourceBudgetConfig) {
          // Create new budget config
          const { data: newBudgetConfig } = await supabase
            .from('budget_configs')
            .upsert({
              user_id: user.id,
              profile_id: data.profile.id,
              budget_period_id: data.budgetPeriod.id,
              monthly_salary: sourceBudgetConfig.monthly_salary,
              budget_percentage: sourceBudgetConfig.budget_percentage,
              total_budget_amount: sourceBudgetConfig.total_budget_amount
            })
            .select()
            .single();

          // Copy allocations
          if (sourceBudgetConfig.allocations && newBudgetConfig) {
            const allocations = sourceBudgetConfig.allocations.map((alloc: any) => ({
              budget_config_id: newBudgetConfig.id,
              budget_module_id: alloc.budget_module_id,
              allocation_percentage: alloc.allocation_percentage,
              allocated_amount: alloc.allocated_amount
            }));

            await supabase
              .from('budget_allocations')
              .insert(allocations);
          }
        }
      }

      if (components.includes('investment_portfolios')) {
        // Copy investment portfolios with nested data
        const { data: sourcePortfolios } = await supabase
          .from('investment_portfolios')
          .select('*, categories:investment_categories(*, funds:investment_funds(*))')
          .eq('budget_period_id', sourcePeriodId);

        if (sourcePortfolios) {
          for (const portfolio of sourcePortfolios) {
            const { data: newPortfolio } = await supabase
              .from('investment_portfolios')
              .insert({
                user_id: user.id,
                profile_id: data.profile.id,
                budget_period_id: data.budgetPeriod.id,
                portfolio_name: portfolio.portfolio_name,
                allocation_type: portfolio.allocation_type,
                allocation_value: portfolio.allocation_value,
                allocated_amount: portfolio.allocated_amount,
                invested_amount: 0, // Reset invested amount
                allow_direct_investment: portfolio.allow_direct_investment
              })
              .select()
              .single();

            // Copy categories and funds
            if (portfolio.categories && newPortfolio) {
              for (const category of portfolio.categories) {
                const { data: newCategory } = await supabase
                  .from('investment_categories')
                  .insert({
                    portfolio_id: newPortfolio.id,
                    category_name: category.category_name,
                    allocation_type: category.allocation_type,
                    allocation_value: category.allocation_value,
                    allocated_amount: category.allocated_amount,
                    invested_amount: 0 // Reset invested amount
                  })
                  .select()
                  .single();

                if (category.funds && newCategory) {
                  const funds = category.funds.map((fund: any) => ({
                    category_id: newCategory.id,
                    fund_name: fund.fund_name,
                    allocated_amount: fund.allocated_amount,
                    invested_amount: 0 // Reset invested amount
                  }));

                  await supabase
                    .from('investment_funds')
                    .insert(funds);
                }
              }
            }
          }
        }
      }

      await fetchBudgetData();
    } catch (err) {
      console.error('Inherit configuration error:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [user, profileId, month, year]);

  return {
    ...data,
    loading,
    error,
    saveBudgetConfig,
    saveInvestmentPortfolio,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    createBudgetModule,
    inheritConfiguration,
    refetch: fetchBudgetData
  };
}
