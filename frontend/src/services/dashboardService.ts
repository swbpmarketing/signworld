// Dashboard Service for API calls
import api from '../config/axios';

export interface DashboardStats {
  owners: {
    total: number;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
  };
  events: {
    total: number;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
  };
  library: {
    total: number;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
  };
  videos: {
    total: number;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
  };
}

export interface Activity {
  id: string;
  type: 'event' | 'owner' | 'file' | 'forum';
  message: string;
  time: string;
}

export interface KPIData {
  value: number;
  change: number;
  trend: 'up' | 'down';
}

export interface ReportsOverviewData {
  kpiData: {
    totalRevenue: KPIData;
    activeProjects: KPIData;
    customerSatisfaction: KPIData;
    avgProjectTime: KPIData;
    newCustomers: KPIData;
    equipmentUtilization: KPIData;
  };
  revenueOverTime: Array<{
    month: string;
    revenue: number;
    profit: number;
  }>;
  projectsByCategory: Array<{
    name: string;
    value: number;
    revenue: number;
  }>;
  performanceMetrics: Array<{
    metric: string;
    current: number;
    target: number;
  }>;
}

// Get dashboard statistics
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch dashboard statistics');
  }
};

// Get recent activity
export const getRecentActivity = async (limit: number = 10): Promise<Activity[]> => {
  try {
    const response = await api.get('/dashboard/activity', {
      params: { limit }
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching recent activity:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch recent activity');
  }
};

// Get reports overview data
export const getReportsOverview = async (): Promise<ReportsOverviewData> => {
  try {
    const response = await api.get('/dashboard/reports/overview');
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching reports overview:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch reports overview');
  }
};

// Revenue Analytics Types
export interface RevenueAnalyticsData {
  stats: Array<{
    label: string;
    value: string;
    change: string;
    positive: boolean;
  }>;
  revenueData: Array<{
    month: string;
    revenue: number;
    lastYear: number;
  }>;
  categoryData: Array<{
    name: string;
    value: number;
    revenue: number;
  }>;
  totalRevenue: number;
  yoyGrowth: number;
}

// Get revenue analytics data
export const getRevenueAnalytics = async (dateRange?: string): Promise<RevenueAnalyticsData> => {
  try {
    const response = await api.get('/dashboard/reports/revenue', {
      params: { dateRange }
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching revenue analytics:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch revenue analytics');
  }
};

// Project Analytics Types
export interface ProjectAnalyticsData {
  stats: Array<{
    label: string;
    value: string;
    icon: string;
    color: string;
  }>;
  projectStatusData: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  completionTrendData: Array<{
    week: string;
    completed: number;
    started: number;
  }>;
  projectTypeData: Array<{
    type: string;
    avgDays: number;
    count: number;
  }>;
  totalProjects: number;
  activeProjects: number;
  completedThisMonth: number;
}

// Get project analytics data
export const getProjectAnalytics = async (): Promise<ProjectAnalyticsData> => {
  try {
    const response = await api.get('/dashboard/reports/projects');
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching project analytics:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch project analytics');
  }
};

// Customer Analytics Types
export interface CustomerAnalyticsData {
  stats: Array<{
    label: string;
    value: string;
    change: string;
    icon: string;
    color: string;
  }>;
  customerGrowthData: Array<{
    month: string;
    new: number;
    total: number;
  }>;
  customerTypeData: Array<{
    name: string;
    value: number;
    count: number;
  }>;
  satisfactionData: Array<{
    rating: string;
    count: number;
    percentage: number;
  }>;
  totalCustomers: number;
  newThisMonth: number;
  retentionRate: number;
  avgSatisfaction: number;
}

// Get customer analytics data
export const getCustomerAnalytics = async (): Promise<CustomerAnalyticsData> => {
  try {
    const response = await api.get('/dashboard/reports/customers');
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching customer analytics:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch customer analytics');
  }
};

// Equipment/Resource Analytics Types
export interface EquipmentAnalyticsData {
  stats: Array<{
    label: string;
    value: string;
    icon: string;
    color: string;
    bgColor: string;
  }>;
  equipmentUtilization: Array<{
    name: string;
    utilization: number;
    revenue: number;
    maintenance: number;
  }>;
  roiTrendData: Array<{
    month: string;
    roi: number;
    utilization: number;
  }>;
  maintenanceSchedule: Array<{
    equipment: string;
    lastService: string;
    nextService: string;
    status: string;
  }>;
}

// Get equipment analytics data
export const getEquipmentAnalytics = async (): Promise<EquipmentAnalyticsData> => {
  try {
    const response = await api.get('/dashboard/reports/equipment');
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching equipment analytics:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch equipment analytics');
  }
};

// Team Performance Analytics Types
export interface TeamAnalyticsData {
  stats: Array<{
    label: string;
    value: string;
    icon: string;
    color: string;
    bgColor: string;
  }>;
  teamProductivity: Array<{
    name: string;
    projects: number;
    revenue: number;
    efficiency: number;
    satisfaction: number;
  }>;
  performanceTrend: Array<{
    week: string;
    completed: number;
    efficiency: number;
  }>;
  skillsData: Array<{
    skill: string;
    A: number;
    B: number;
    fullMark: number;
  }>;
}

// Get team analytics data
export const getTeamAnalytics = async (): Promise<TeamAnalyticsData> => {
  try {
    const response = await api.get('/dashboard/reports/team');
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching team analytics:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch team analytics');
  }
};

// Geographic Analytics Types
export interface GeographicAnalyticsData {
  stats: Array<{
    label: string;
    value: string;
    icon: string;
    color: string;
    bgColor: string;
  }>;
  regionData: Array<{
    region: string;
    revenue: number;
    stores: number;
    growth: number;
  }>;
  cityPerformance: Array<{
    city: string;
    revenue: number;
    projects: number;
    distance: number;
  }>;
  serviceAreaData: Array<{
    range: string;
    percentage: number;
    projects: number;
  }>;
}

// Get geographic analytics data
export const getGeographicAnalytics = async (): Promise<GeographicAnalyticsData> => {
  try {
    const response = await api.get('/dashboard/reports/geographic');
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching geographic analytics:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch geographic analytics');
  }
};

// Financial Analytics Types
export interface FinancialAnalyticsData {
  stats: Array<{
    label: string;
    value: string;
    change: string;
    positive: boolean;
    icon: string;
  }>;
  cashFlowData: Array<{
    month: string;
    income: number;
    expenses: number;
    netCash: number;
  }>;
  expenseBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  profitMargins: Array<{
    month: string;
    gross: number;
    operating: number;
    net: number;
  }>;
  financialSummary: {
    totalRevenue: number;
    totalExpenses: number;
    grossProfit: number;
    netIncome: number;
    ebitda: number;
    currentRatio: string;
  };
}

// Get financial analytics data
export const getFinancialAnalytics = async (): Promise<FinancialAnalyticsData> => {
  try {
    const response = await api.get('/dashboard/reports/financial');
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching financial analytics:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch financial analytics');
  }
};
