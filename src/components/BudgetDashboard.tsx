import { useState, useEffect } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  PiggyBank, 
  CreditCard, 
  Target,
  Calendar,
  Users,
  Wallet,
  Settings,
  Lock,
  Home,
  Music,
  Plus,
  Edit,
  Trash2,
  Filter,
  Search,
  UserCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import SalaryConfig from "./SalaryConfig";
import InvestmentConfig from "./InvestmentConfig";

interface BudgetAllocation {
  need: number;
  want: number;
  savings: number;
  investments: number;
}

interface CategorySpending {
  need: number;
  want: number;
  savings: number;
  investments: number;
}

interface Fund {
  id: string;
  name: string;
  allocatedAmount: number;
}

interface PortfolioCategory {
  id: string;
  name: string;
  allocationType: 'percentage' | 'amount';
  allocationValue: number;
  allocatedAmount: number;
  funds: Fund[];
}

interface Portfolio {
  id: string;
  name: string;
  allocationType: 'percentage' | 'amount';
  allocationValue: number;
  allocatedAmount: number;
  categories: PortfolioCategory[];
}

interface InvestmentPlan {
  portfolios: Portfolio[];
}

interface ExpenseEntry {
  id: string;
  date: string;
  spentFor: string;
  amount: number;
  notes: string;
  category: 'need' | 'want' | 'savings' | 'investments';
  tag?: string;
  paymentType?: 'SENT BY ME' | 'SENT TO VALAR' | 'SENT TO MURALI';
}

interface UserProfile {
  name: string;
  partnerName: string;
  salary: number;
  budgetPercentage: number;
  budgetAllocation: BudgetAllocation;
  expenses: ExpenseEntry[];
  customTags: string[];
  investmentPlan: InvestmentPlan;
}

const DEFAULT_TAGS = {
  need: ['EMI\'s', 'Entertainments', 'Fuel', 'Gas', 'Grocessories', 'Hotels/Food', 'Mobile recharges', 'Others', 'Rent', 'Transportation'],
  want: ['Entertainments', 'Hobbies', 'Movies', 'Others', 'Restaurants', 'Shopping'],
  savings: ['Emergency Fund', 'Fixed Deposit', 'Others', 'Savings Account'],
  investments: ['Mutual Funds', 'Others', 'PPF', 'Stocks', 'SIP']
};

const TAG_COLORS = {
  'Rent': 'bg-red-100 text-red-800 border-red-200',
  'Hotels/Food': 'bg-orange-100 text-orange-800 border-orange-200',
  'Transportation': 'bg-blue-100 text-blue-800 border-blue-200',
  'Grocessories': 'bg-green-100 text-green-800 border-green-200',
  'Mobile recharges': 'bg-purple-100 text-purple-800 border-purple-200',
  'EMI\'s': 'bg-pink-100 text-pink-800 border-pink-200',
  'Entertainments': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Gas': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Fuel': 'bg-gray-100 text-gray-800 border-gray-200',
  'Others': 'bg-slate-100 text-slate-800 border-slate-200',
  'Hobbies': 'bg-teal-100 text-teal-800 border-teal-200',
  'Movies': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Restaurants': 'bg-amber-100 text-amber-800 border-amber-200',
  'Shopping': 'bg-rose-100 text-rose-800 border-rose-200',
  'Emergency Fund': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Fixed Deposit': 'bg-lime-100 text-lime-800 border-lime-200',
  'Savings Account': 'bg-green-100 text-green-800 border-green-200',
  'Mutual Funds': 'bg-blue-100 text-blue-800 border-blue-200',
  'PPF': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Stocks': 'bg-purple-100 text-purple-800 border-purple-200',
  'SIP': 'bg-pink-100 text-pink-800 border-pink-200'
};

const BudgetDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [currentUser, setCurrentUser] = useState<'murali' | 'valar'>('murali');
  const [showConfigHint, setShowConfigHint] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterDate, setFilterDate] = useState('');
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<Record<'murali' | 'valar', UserProfile>>({
    murali: {
      name: 'Murali',
      partnerName: 'Valar',
      salary: 20000,
      budgetPercentage: 70,
      budgetAllocation: { need: 50, want: 30, savings: 15, investments: 5 },
      expenses: [],
      customTags: [],
      investmentPlan: { portfolios: [] }
    },
    valar: {
      name: 'Valar',
      partnerName: 'Murali',
      salary: 15000,
      budgetPercentage: 70,
      budgetAllocation: { need: 50, want: 30, savings: 15, investments: 5 },
      expenses: [],
      customTags: [],
      investmentPlan: { portfolios: [] }
    }
  });

  const currentProfile = profiles[currentUser];
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const calculatedTotalBudget = Math.round(currentProfile.salary * currentProfile.budgetPercentage / 100);

  const getAllocatedAmounts = () => {
    return {
      need: Math.round(calculatedTotalBudget * currentProfile.budgetAllocation.need / 100),
      want: Math.round(calculatedTotalBudget * currentProfile.budgetAllocation.want / 100),
      savings: Math.round(calculatedTotalBudget * currentProfile.budgetAllocation.savings / 100),
      investments: Math.round(calculatedTotalBudget * currentProfile.budgetAllocation.investments / 100)
    };
  };

  const allocatedAmounts = getAllocatedAmounts();

  // Calculate spending from expenses
  const getSpendingByCategory = () => {
    const currentMonthExpenses = currentProfile.expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === selectedMonth;
    });

    return {
      need: currentMonthExpenses.filter(e => e.category === 'need').reduce((sum, e) => sum + e.amount, 0),
      want: currentMonthExpenses.filter(e => e.category === 'want').reduce((sum, e) => sum + e.amount, 0),
      savings: currentMonthExpenses.filter(e => e.category === 'savings').reduce((sum, e) => sum + e.amount, 0),
      investments: currentMonthExpenses.filter(e => e.category === 'investments').reduce((sum, e) => sum + e.amount, 0)
    };
  };

  const categorySpending = getSpendingByCategory();
  
  // Updated total spent calculation: sum of all category spending
  const totalSpent = categorySpending.need + categorySpending.want + categorySpending.savings + categorySpending.investments;
  const totalRemaining = calculatedTotalBudget - totalSpent;

  const handleSalaryUpdate = (salary: number, percentage: number) => {
    setProfiles(prev => ({
      ...prev,
      [currentUser]: {
        ...prev[currentUser],
        salary,
        budgetPercentage: percentage
      }
    }));
    localStorage.setItem('budgetProfiles', JSON.stringify({
      ...profiles,
      [currentUser]: {
        ...profiles[currentUser],
        salary,
        budgetPercentage: percentage
      }
    }));
  };

  const handleInvestmentPlanUpdate = (plan: InvestmentPlan) => {
    const updatedProfiles = {
      ...profiles,
      [currentUser]: {
        ...profiles[currentUser],
        investmentPlan: plan
      }
    };
    
    saveProfiles(updatedProfiles);
  };

  const switchUser = () => {
    setCurrentUser(prev => prev === 'murali' ? 'valar' : 'murali');
  };

  useEffect(() => {
    const saved = localStorage.getItem('budgetProfiles');
    if (saved) {
      setProfiles(JSON.parse(saved));
    }
  }, []);

  const saveProfiles = (newProfiles: typeof profiles) => {
    setProfiles(newProfiles);
    localStorage.setItem('budgetProfiles', JSON.stringify(newProfiles));
  };

  const addExpense = (category: string, spentFor: string, amount: number, notes: string, tag?: string, paymentType?: string) => {
    const newExpense: ExpenseEntry = {
      id: Date.now().toString(),
      date: selectedDate,
      spentFor,
      amount,
      notes,
      category: category as 'need' | 'want' | 'savings' | 'investments',
      tag,
      paymentType: paymentType as 'SENT BY ME' | 'SENT TO VALAR' | 'SENT TO MURALI'
    };
    
    const updatedProfiles = {
      ...profiles,
      [currentUser]: {
        ...profiles[currentUser],
        expenses: [...profiles[currentUser].expenses, newExpense]
      }
    };
    
    saveProfiles(updatedProfiles);
    
    toast({
      title: "Expense Added",
      description: `Added ₹${amount} for ${spentFor}`,
    });
  };

  const updateExpense = (id: string, spentFor: string, amount: number, notes: string, tag?: string, paymentType?: string) => {
    const updatedProfiles = {
      ...profiles,
      [currentUser]: {
        ...profiles[currentUser],
        expenses: profiles[currentUser].expenses.map(expense =>
          expense.id === id ? { ...expense, spentFor, amount, notes, tag, paymentType } : expense
        )
      }
    };
    
    saveProfiles(updatedProfiles);
    
    toast({
      title: "Expense Updated",
      description: `Updated expense for ${spentFor}`,
    });
  };

  const deleteExpense = (id: string) => {
    const updatedProfiles = {
      ...profiles,
      [currentUser]: {
        ...profiles[currentUser],
        expenses: profiles[currentUser].expenses.filter(expense => expense.id !== id)
      }
    };
    
    saveProfiles(updatedProfiles);
    
    toast({
      title: "Expense Deleted",
      description: "Expense has been removed",
    });
  };

  const addCustomTag = (category: string, newTag: string) => {
    const updatedProfiles = {
      ...profiles,
      [currentUser]: {
        ...profiles[currentUser],
        customTags: [...profiles[currentUser].customTags, `${category}:${newTag}`]
      }
    };
    
    saveProfiles(updatedProfiles);
  };

  const getTagsForCategory = (category: string) => {
    const defaultTags = DEFAULT_TAGS[category as keyof typeof DEFAULT_TAGS] || [];
    const customTags = profiles[currentUser].customTags
      .filter(tag => tag.startsWith(`${category}:`))
      .map(tag => tag.split(':')[1]);
    
    return [...defaultTags, ...customTags].sort();
  };

  const getTagColor = (tag: string) => {
    return TAG_COLORS[tag as keyof typeof TAG_COLORS] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const QuickStatsCard = ({ title, amount, icon: Icon, variant = "default", change }: any) => (
    <Card className="shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:scale-[1.02] bg-gradient-to-br from-card to-muted/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${
          variant === 'success' ? 'text-success' : 
          variant === 'warning' ? 'text-warning' : 
          variant === 'destructive' ? 'text-destructive' : 
          'text-primary'
        }`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          ₹{amount.toLocaleString()}
        </div>
        {change && (
          <p className={`text-xs ${change >= 0 ? 'text-success' : 'text-destructive'}`}>
            {change >= 0 ? '+' : ''}{change}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );

  const CategoryProgressCard = ({ 
    title, 
    icon: Icon, 
    allocated, 
    spent, 
    variant = "default" 
  }: {
    title: string;
    icon: any;
    allocated: number;
    spent: number;
    variant?: string;
  }) => {
    const remaining = allocated - spent;
    const progressPercentage = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
    const isOverBudget = spent > allocated;
    
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${
                variant === 'need' ? 'text-destructive' :
                variant === 'want' ? 'text-warning' :
                variant === 'savings' ? 'text-success' :
                variant === 'investments' ? 'text-primary' :
                'text-muted-foreground'
              }`} />
              <span className="text-sm font-medium">{title}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {progressPercentage.toFixed(0)}%
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress 
            value={progressPercentage} 
            className={`h-2 ${isOverBudget ? '[&>div]:bg-destructive' : ''}`}
          />
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <p className="text-muted-foreground">Planned</p>
              <p className="font-semibold">₹{allocated.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Spent</p>
              <p className={`font-semibold ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
                ₹{spent.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Remaining</p>
              <p className={`font-semibold ${
                remaining >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                ₹{remaining.toLocaleString()}
              </p>
            </div>
          </div>
          {isOverBudget && (
            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
              Over budget by ₹{(spent - allocated).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const ExpenseEntryDialog = ({ category, categoryTitle, icon: Icon }: { 
    category: string; 
    categoryTitle: string; 
    icon: any; 
  }) => {
    const [open, setOpen] = useState(false);
    const [spentFor, setSpentFor] = useState('');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [customTag, setCustomTag] = useState('');
    const [paymentType, setPaymentType] = useState('SENT BY ME');
    const [showCustomTag, setShowCustomTag] = useState(false);

    const tags = getTagsForCategory(category);
    const paymentOptions = currentUser === 'murali' 
      ? ['SENT BY ME', 'SENT TO VALAR']
      : ['SENT BY ME', 'SENT TO MURALI'];

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!spentFor || !amount || !selectedTag) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields including tag",
          variant: "destructive",
        });
        return;
      }

      let finalTag = selectedTag;
      if (selectedTag === 'Others' && customTag) {
        finalTag = customTag;
        addCustomTag(category, customTag);
      }

      addExpense(category, spentFor, parseFloat(amount), notes, finalTag, paymentType);
      setSpentFor('');
      setAmount('');
      setNotes('');
      setSelectedTag('');
      setCustomTag('');
      setPaymentType('SENT BY ME');
      setShowCustomTag(false);
      setOpen(false);
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="mb-4">
            <Plus className="h-4 w-4 mr-2" />
            Add {categoryTitle} Entry
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              Add {categoryTitle} Entry
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spentFor">Spent For *</Label>
              <Input
                id="spentFor"
                value={spentFor}
                onChange={(e) => setSpentFor(e.target.value)}
                placeholder="What did you spend on?"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag">Tag *</Label>
              <Select value={selectedTag} onValueChange={(value) => {
                setSelectedTag(value);
                setShowCustomTag(value === 'Others');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tag" />
                </SelectTrigger>
                <SelectContent>
                  {tags.map((tag) => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showCustomTag && (
              <div className="space-y-2">
                <Label htmlFor="customTag">Custom Tag Name *</Label>
                <Input
                  id="customTag"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Enter custom tag name"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Payment Type *</Label>
              <RadioGroup value={paymentType} onValueChange={setPaymentType}>
                {paymentOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={option} />
                    <Label htmlFor={option}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes (optional)"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Entry</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const EditExpenseDialog = ({ expense }: { expense: ExpenseEntry }) => {
    const [open, setOpen] = useState(false);
    const [spentFor, setSpentFor] = useState(expense.spentFor);
    const [amount, setAmount] = useState(expense.amount.toString());
    const [notes, setNotes] = useState(expense.notes);
    const [selectedTag, setSelectedTag] = useState(expense.tag || '');
    const [customTag, setCustomTag] = useState('');
    const [paymentType, setPaymentType] = useState(expense.paymentType || 'SENT BY ME');
    const [showCustomTag, setShowCustomTag] = useState(false);

    const tags = getTagsForCategory(expense.category);
    const paymentOptions = currentUser === 'murali' 
      ? ['SENT BY ME', 'SENT TO VALAR']
      : ['SENT BY ME', 'SENT TO MURALI'];

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!spentFor || !amount || !selectedTag) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields including tag",
          variant: "destructive",
        });
        return;
      }

      let finalTag = selectedTag;
      if (selectedTag === 'Others' && customTag) {
        finalTag = customTag;
        addCustomTag(expense.category, customTag);
      }

      updateExpense(expense.id, spentFor, parseFloat(amount), notes, finalTag, paymentType);
      setOpen(false);
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-spentFor">Spent For *</Label>
              <Input
                id="edit-spentFor"
                value={spentFor}
                onChange={(e) => setSpentFor(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount *</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tag">Tag *</Label>
              <Select value={selectedTag} onValueChange={(value) => {
                setSelectedTag(value);
                setShowCustomTag(value === 'Others');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tag" />
                </SelectTrigger>
                <SelectContent>
                  {tags.map((tag) => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showCustomTag && (
              <div className="space-y-2">
                <Label htmlFor="edit-customTag">Custom Tag Name *</Label>
                <Input
                  id="edit-customTag"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Enter custom tag name"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Payment Type *</Label>
              <RadioGroup value={paymentType} onValueChange={setPaymentType}>
                {paymentOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`edit-${option}`} />
                    <Label htmlFor={`edit-${option}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Entry</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const ExpenseTable = ({ category, categoryTitle }: { category: string; categoryTitle: string }) => {
    const categoryExpenses = currentProfile.expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const matchesCategory = expense.category === category;
      const matchesMonth = expenseDate.getMonth() === selectedMonth;
      const matchesDateFilter = !filterDate || expense.date === filterDate;
      
      return matchesCategory && matchesMonth && matchesDateFilter;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{categoryTitle} Entries</h3>
          <div className="flex items-center space-x-2">
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-auto"
              placeholder="Filter by date"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterDate('')}
            >
              Clear
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">S.No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Spent For</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Type</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No entries found for {categoryTitle.toLowerCase()}
                  </TableCell>
                </TableRow>
              ) : (
                categoryExpenses.map((expense, index) => (
                  <TableRow key={expense.id} className={expense.tag ? getTagColor(expense.tag) : ''}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {expense.tag && (
                        <Badge variant="outline" className={getTagColor(expense.tag)}>
                          {expense.tag}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{expense.spentFor}</TableCell>
                    <TableCell>₹{expense.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {expense.paymentType || 'SENT BY ME'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{expense.notes || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <EditExpenseDialog expense={expense} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this expense entry? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteExpense(expense.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <div className="bg-card shadow-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <Wallet className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Budget Tracker</h1>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-sm">
                  {currentProfile.name}'s Profile
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchUser}
                  className="flex items-center gap-2"
                >
                  <UserCheck className="h-4 w-4" />
                  Switch to {currentUser === 'murali' ? 'Valar' : 'Murali'}
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date().getFullYear()}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats - Budget Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <QuickStatsCard
            title="Total Budget"
            amount={calculatedTotalBudget}
            icon={Target}
            variant="default"
            change={5.2}
          />
          <QuickStatsCard
            title="Need (Essential)"
            amount={allocatedAmounts.need}
            icon={Home}
            variant="destructive"
          />
          <QuickStatsCard
            title="Want (Discretionary)"
            amount={allocatedAmounts.want}
            icon={Music}
            variant="warning"
          />
          <QuickStatsCard
            title="Savings"
            amount={allocatedAmounts.savings}
            icon={PiggyBank}
            variant="success"
          />
          <QuickStatsCard
            title="Investments"
            amount={allocatedAmounts.investments}
            icon={TrendingUp}
            variant="default"
          />
        </div>

        {/* Salary Configuration Info */}
        <div className="mb-6 flex justify-between items-center p-4 bg-gradient-to-r from-primary/5 to-success/5 rounded-lg border">
          <div>
            <p className="text-sm text-muted-foreground">
              Budget calculated from <strong>{currentProfile.budgetPercentage}%</strong> of monthly salary
            </p>
            <p className="text-xs text-muted-foreground">
              Current budget: ₹{calculatedTotalBudget.toLocaleString()}
              {currentProfile.salary > 0 && ` (from ₹${currentProfile.salary.toLocaleString()} salary)`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfigHint(!showConfigHint)}
            className="text-xs"
          >
            <Settings className="h-3 w-3 mr-1" />
            Configure
          </Button>
        </div>

        {showConfigHint && (
          <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <p className="text-sm text-warning-foreground">
              💡 <strong>Tip:</strong> You can access salary configuration through the hidden "Configuration" tab. 
              Look for the lock icon in the tab bar below.
            </p>
          </div>
        )}

        {/* Main Navigation Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-muted p-1 rounded-lg">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="need" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Need</span>
            </TabsTrigger>
            <TabsTrigger value="want" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              <span className="hidden sm:inline">Want</span>
            </TabsTrigger>
            <TabsTrigger value="savings" className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              <span className="hidden sm:inline">Savings</span>
            </TabsTrigger>
            <TabsTrigger value="investments" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Investments</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2 text-warning" title="Salary Configuration (Password Protected)">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Budget Category Progress Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <CategoryProgressCard
                  title="Need (Essential)"
                  icon={Home}
                  allocated={allocatedAmounts.need}
                  spent={categorySpending.need}
                  variant="need"
                />
                <CategoryProgressCard
                  title="Want (Discretionary)"
                  icon={Music}
                  allocated={allocatedAmounts.want}
                  spent={categorySpending.want}
                  variant="want"
                />
                <CategoryProgressCard
                  title="Savings"
                  icon={PiggyBank}
                  allocated={allocatedAmounts.savings}
                  spent={categorySpending.savings}
                  variant="savings"
                />
                <CategoryProgressCard
                  title="Investments"
                  icon={TrendingUp}
                  allocated={allocatedAmounts.investments}
                  spent={categorySpending.investments}
                  variant="investments"
                />
              </div>

              {/* Overall Summary */}
              <Card className="shadow-card bg-gradient-to-r from-primary/5 to-success/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Monthly Budget Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-background/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Allocated</p>
                      <p className="text-2xl font-bold text-primary">₹{calculatedTotalBudget.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-4 bg-background/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <p className="text-2xl font-bold text-destructive">₹{totalSpent.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">Need + Want + Savings + Investments</p>
                    </div>
                    <div className="text-center p-4 bg-background/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="text-2xl font-bold text-accent">₹{totalRemaining.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total Allocated - Total Spent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="need">
            <div className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Home className="h-6 w-6" />
                    Need (Essential Expenses)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track your essential expenses like rent, utilities, groceries, insurance
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <CategoryProgressCard
                      title="Need Progress"
                      icon={Home}
                      allocated={allocatedAmounts.need}
                      spent={categorySpending.need}
                      variant="need"
                    />
                  </div>
                  <ExpenseEntryDialog category="need" categoryTitle="Need" icon={Home} />
                  <ExpenseTable category="need" categoryTitle="Need" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="want">
            <div className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-warning">
                    <Music className="h-6 w-6" />
                    Want (Discretionary Expenses)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track your discretionary spending like entertainment, dining out, hobbies
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <CategoryProgressCard
                      title="Want Progress"
                      icon={Music}
                      allocated={allocatedAmounts.want}
                      spent={categorySpending.want}
                      variant="want"
                    />
                  </div>
                  <ExpenseEntryDialog category="want" categoryTitle="Want" icon={Music} />
                  <ExpenseTable category="want" categoryTitle="Want" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="savings">
            <div className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-success">
                    <PiggyBank className="h-6 w-6" />
                    Savings (Emergency Fund)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track your savings contributions and emergency fund building
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <CategoryProgressCard
                      title="Savings Progress"
                      icon={PiggyBank}
                      allocated={allocatedAmounts.savings}
                      spent={categorySpending.savings}
                      variant="savings"
                    />
                  </div>
                  <ExpenseEntryDialog category="savings" categoryTitle="Savings" icon={PiggyBank} />
                  <ExpenseTable category="savings" categoryTitle="Savings" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="investments">
            <div className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <TrendingUp className="h-6 w-6" />
                    Investments (Long-term Growth)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track your investment contributions like stocks, mutual funds, retirement
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <CategoryProgressCard
                      title="Investment Progress"
                      icon={TrendingUp}
                      allocated={allocatedAmounts.investments}
                      spent={categorySpending.investments}
                      variant="investments"
                    />
                  </div>
                  <ExpenseEntryDialog category="investments" categoryTitle="Investments" icon={TrendingUp} />
                  <ExpenseTable category="investments" categoryTitle="Investments" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="config">
            <SalaryConfig 
              onSalaryUpdate={handleSalaryUpdate}
              currentSalary={currentProfile.salary}
              currentBudgetPercentage={currentProfile.budgetPercentage}
            />
            
            <div className="mt-8">
              <InvestmentConfig
                totalInvestmentAmount={allocatedAmounts.investments}
                currentUser={currentUser}
                onInvestmentPlanUpdate={handleInvestmentPlanUpdate}
                currentInvestmentPlan={currentProfile.investmentPlan}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BudgetDashboard;