import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";

interface RevenueData {
  date: string;
  revenue: number;
  bills_count: number;
  cumulative_revenue: number;
}

interface PaymentMethodData {
  method: string;
  amount: number;
  count: number;
}

export const RevenueTrends = () => {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<PaymentMethodData[]>([]);
  const [timePeriod, setTimePeriod] = useState("30"); // days
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueGrowth, setRevenueGrowth] = useState(0);

  useEffect(() => {
    fetchRevenueData();
  }, [timePeriod]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const daysAgo = parseInt(timePeriod);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      const startDateString = startDate.toISOString().split('T')[0];

      // Fetch daily revenue data
      const { data: billsData, error } = await supabase
        .from('bills')
        .select('created_at, amount, payment_method')
        .gte('created_at', startDateString)
        .eq('is_paid', true)
        .order('created_at');

      if (error) throw error;

      // Process data for charts
      const dailyRevenue: { [key: string]: { revenue: number; count: number } } = {};
      const paymentMethods: { [key: string]: { amount: number; count: number } } = {};
      let total = 0;

      billsData?.forEach(bill => {
        const date = bill.created_at.split('T')[0];
        const amount = Number(bill.amount);
        total += amount;

        // Daily revenue
        if (!dailyRevenue[date]) {
          dailyRevenue[date] = { revenue: 0, count: 0 };
        }
        dailyRevenue[date].revenue += amount;
        dailyRevenue[date].count += 1;

        // Payment methods
        const method = bill.payment_method || 'Cash';
        if (!paymentMethods[method]) {
          paymentMethods[method] = { amount: 0, count: 0 };
        }
        paymentMethods[method].amount += amount;
        paymentMethods[method].count += 1;
      });

      // Convert to chart data
      const chartData: RevenueData[] = [];
      let cumulativeRevenue = 0;

      for (let i = daysAgo - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const dayData = dailyRevenue[dateString] || { revenue: 0, count: 0 };
        cumulativeRevenue += dayData.revenue;
        
        chartData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: dayData.revenue,
          bills_count: dayData.count,
          cumulative_revenue: cumulativeRevenue
        });
      }

      const methodsData = Object.entries(paymentMethods).map(([method, data]) => ({
        method,
        amount: data.amount,
        count: data.count
      }));

      setRevenueData(chartData);
      setPaymentMethodData(methodsData);
      setTotalRevenue(total);

      // Calculate growth rate (compare first vs last week)
      if (chartData.length >= 14) {
        const firstWeekAvg = chartData.slice(0, 7).reduce((sum, day) => sum + day.revenue, 0) / 7;
        const lastWeekAvg = chartData.slice(-7).reduce((sum, day) => sum + day.revenue, 0) / 7;
        const growth = firstWeekAvg > 0 ? ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100 : 0;
        setRevenueGrowth(growth);
      }

    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls and Summary */}
      <Card className="transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Analytics
              </CardTitle>
              <CardDescription>Track revenue trends and payment patterns</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">₦{totalRevenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 text-sm">
                  {revenueGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                    {Math.abs(revenueGrowth).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground">vs prev period</span>
                </div>
              </div>
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Line Chart */}
        <Card className="transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Daily Revenue Trend
            </CardTitle>
            <CardDescription>Revenue collected per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Revenue']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cumulative Revenue Area Chart */}
        <Card className="transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Cumulative Revenue
            </CardTitle>
            <CardDescription>Total revenue accumulated over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Cumulative Revenue']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cumulative_revenue" 
                    stroke="#10b981" 
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bills Count Bar Chart */}
        <Card className="transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Daily Bills Processed
            </CardTitle>
            <CardDescription>Number of bills processed per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Bills Processed']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="bills_count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Pie Chart */}
        <Card className="transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
          <CardHeader>
            <CardTitle>Payment Methods Distribution</CardTitle>
            <CardDescription>Revenue breakdown by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                    label={({ method, percent }) => `${method} ${(percent * 100).toFixed(1)}%`}
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Amount']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {paymentMethodData.map((method, index) => (
                <Badge key={method.method} variant="outline" className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  {method.method}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};