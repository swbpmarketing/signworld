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
