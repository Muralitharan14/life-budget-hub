const handleInvestmentPlanUpdate = async (plan) => {
  if (!user) {
    toast({
      title: "Authentication Required",
      description: "Please sign in to save your investment plan.",
      variant: "destructive",
    });
    return;
  }

  try {
    console.log('Saving investment plan with local storage...');
    
    // Clear existing portfolios for this period
    await deleteAllInvestmentPortfolios();

    // Save each portfolio
    for (const portfolio of plan.portfolios) {
      await saveInvestmentPortfolio({
        name: portfolio.name,
        allocation_type: portfolio.allocationType,
        allocation_value: portfolio.allocationValue,
        allocated_amount: portfolio.allocatedAmount,
        invested_amount: portfolio.investedAmount || 0,
        allow_direct_investment: portfolio.allowDirectInvestment,
        is_active: true,
      });
    }

    // Refresh data to show the saved portfolios
    await refetch();

    toast({
      title: "Investment Plan Saved",
      description: `Successfully saved ${plan.portfolios.length} portfolios.`,
    });
  } catch (error) {
    console.error("Error saving investment plan:", error);

    let errorMessage = "Failed to save investment plan. Please try again.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    toast({
      title: "Save Failed",
      description: errorMessage,
      variant: "destructive",
    });
  }
};
