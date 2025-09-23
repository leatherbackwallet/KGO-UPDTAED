import React, { useState, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../utils/api';
import AdminTabs from './AdminTabs';

interface FinancialData {
  summary: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    profitMargin: number;
    totalOrders: number;
    averageOrderValue: number;
    revenueGrowth: number;
    profitGrowth: number;
  };
  orders: Array<{
    orderId: string;
    orderNumber: string;
    customerName: string;
    date: string;
    revenue: number;
    cost: number;
    profit: number;
    profitMargin: number;
  }>;
  monthlyData: Array<{
    month: string;
    revenue: number;
    cost: number;
    profit: number;
    orders: number;
  }>;
  categoryData: Array<{
    category: string;
    revenue: number;
    cost: number;
    profit: number;
    orders: number;
    quantity: number;
  }>;
}

interface OrderBreakdown {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  date: string;
  status: string;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  items: number;
  paymentMethod: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState<'aggregates' | 'orders'>('aggregates');
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [orderBreakdown, setOrderBreakdown] = useState<OrderBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tabs = [
    { id: 'aggregates', label: 'Aggregates Dashboard' },
    { id: 'orders', label: 'Order-wise Breakdown' }
  ];

  // Load financial data
  const loadFinancialData = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      const response = await api.get('/finance/aggregates', {
        params: { period, startDate, endDate }
      });
      if (response.data.success) {
        setFinancialData(response.data.data);
      } else {
        setError(response.data.error?.message || 'Failed to load financial data');
      }
    } catch (err: any) {
      console.error('Finance API Error:', err);
      setError(err.response?.data?.message || 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  // Load order breakdown
  const loadOrderBreakdown = async () => {
    try {
      const response = await api.get('/finance/orders', {
        params: { period, startDate, endDate }
      });
      if (response.data.success) {
        setOrderBreakdown(response.data.data.orders || []);
      } else {
        console.error('Failed to load order breakdown:', response.data.error?.message);
        setOrderBreakdown([]);
      }
    } catch (err: any) {
      console.error('Failed to load order breakdown:', err);
      setOrderBreakdown([]);
    }
  };

  useEffect(() => {
    loadFinancialData();
    loadOrderBreakdown();
  }, [period, startDate, endDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getGrowthColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? '↗' : '↘';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Income & Expenditure</h1>
        <p className="text-gray-600">Comprehensive financial analytics and reporting</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <AdminTabs
          tabs={tabs.map(t => t.label)}
          activeTab={tabs.find(t => t.id === activeTab)?.label || 'Aggregates Dashboard'}
          onTabChange={(tabLabel) => {
            const tabId = tabs.find(t => t.label === tabLabel)?.id as any;
            setActiveTab(tabId);
          }}
        />
      </div>

      {/* Date Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quick Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setPeriod('month');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => {
                setError('');
                loadFinancialData();
                loadOrderBreakdown();
              }}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading financial data...</p>
        </div>
      )}

      {activeTab === 'aggregates' && financialData ? (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(financialData.summary?.totalRevenue || 0)}
                  </p>
                  <div className={`flex items-center text-sm ${getGrowthColor(financialData.summary?.revenueGrowth || 0)}`}>
                    <span className="mr-1">{getGrowthIcon(financialData.summary?.revenueGrowth || 0)}</span>
                    {formatPercentage(financialData.summary?.revenueGrowth || 0)}
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cost</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(financialData.summary?.totalCost || 0)}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Profit</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(financialData.summary?.totalProfit || 0)}
                  </p>
                  <div className={`flex items-center text-sm ${getGrowthColor(financialData.summary?.profitGrowth || 0)}`}>
                    <span className="mr-1">{getGrowthIcon(financialData.summary?.profitGrowth || 0)}</span>
                    {formatPercentage(financialData.summary?.profitGrowth || 0)}
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPercentage(financialData.summary?.profitMargin || 0)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {financialData.summary?.totalOrders || 0} orders
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue vs Cost Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Cost Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={financialData.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => format(new Date(value + '-01'), 'MMM yyyy')}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => format(new Date(label + '-01'), 'MMMM yyyy')}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" name="Revenue" />
                  <Area type="monotone" dataKey="cost" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Cost" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Profit Trend */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={financialData.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => format(new Date(value + '-01'), 'MMM yyyy')}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => format(new Date(label + '-01'), 'MMMM yyyy')}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="profit" stroke="#00C49F" strokeWidth={2} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category Performance */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={financialData.categoryData || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => `${props.category}: ${formatCurrency(props.revenue)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {(financialData.categoryData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Order Volume */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Volume</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={financialData.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => format(new Date(value + '-01'), 'MMM yyyy')}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => value}
                    labelFormatter={(label) => format(new Date(label + '-01'), 'MMMM yyyy')}
                  />
                  <Legend />
                  <Bar dataKey="orders" fill="#FFBB28" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : activeTab === 'aggregates' && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">No financial data available for the selected period.</p>
        </div>
      )}

      {activeTab === 'orders' && orderBreakdown.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Order-wise Financial Breakdown</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderBreakdown.map((order) => (
                  <tr key={order.orderId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(order.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.cost)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      order.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(order.profit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPercentage(order.profitMargin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'orders' && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">No orders found for the selected period.</p>
        </div>
      )}
    </div>
  );
} 