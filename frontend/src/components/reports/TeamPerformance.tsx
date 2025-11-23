import React from 'react';
import { UsersIcon, TrophyIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import { BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TeamPerformanceProps {
  dateRange: string;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
}

const TeamPerformance: React.FC<TeamPerformanceProps> = ({ dateRange, filters, onFiltersChange }) => {
  // Mock data
  const teamProductivity = [
    { name: 'John Smith', projects: 12, revenue: 45000, efficiency: 92, satisfaction: 4.8 },
    { name: 'Sarah Johnson', projects: 15, revenue: 52000, efficiency: 88, satisfaction: 4.6 },
    { name: 'Mike Davis', projects: 10, revenue: 38000, efficiency: 95, satisfaction: 4.9 },
    { name: 'Emily Brown', projects: 14, revenue: 48000, efficiency: 90, satisfaction: 4.7 },
    { name: 'Tom Wilson', projects: 11, revenue: 41000, efficiency: 87, satisfaction: 4.5 },
  ];

  const performanceTrend = [
    { week: 'W1', completed: 18, efficiency: 85 },
    { week: 'W2', completed: 22, efficiency: 88 },
    { week: 'W3', completed: 20, efficiency: 87 },
    { week: 'W4', completed: 25, efficiency: 91 },
    { week: 'W5', completed: 23, efficiency: 89 },
    { week: 'W6', completed: 26, efficiency: 92 },
  ];

  const skillsData = [
    { skill: 'Installation', A: 95, B: 85, fullMark: 100 },
    { skill: 'Design', A: 80, B: 90, fullMark: 100 },
    { skill: 'Customer Service', A: 92, B: 88, fullMark: 100 },
    { skill: 'Technical', A: 88, B: 95, fullMark: 100 },
    { skill: 'Time Management', A: 85, B: 82, fullMark: 100 },
    { skill: 'Safety', A: 98, B: 96, fullMark: 100 },
  ];

  const stats = [
    { 
      label: 'Team Members', 
      value: '12', 
      icon: UsersIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    { 
      label: 'Avg. Efficiency', 
      value: '90.4%', 
      icon: ChartBarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    { 
      label: 'Projects/Week', 
      value: '23.5', 
      icon: ClockIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    { 
      label: 'Team Rating', 
      value: '4.7/5', 
      icon: TrophyIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor} dark:bg-opacity-20`}>
                <stat.icon className={`h-6 w-6 ${stat.color} dark:opacity-90`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Team Leaderboard */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Team Performance Leaderboard</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Team Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Projects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Efficiency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {teamProductivity.map((member, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {member.projects}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    ${(member.revenue / 1000).toFixed(0)}k
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2 max-w-[100px]">
                        <div
                          className="bg-green-600 dark:bg-green-500 h-2 rounded-full"
                          style={{ width: `${member.efficiency}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{member.efficiency}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.satisfaction}</span>
                      <svg className="ml-1 w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Weekly Performance Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey="week" className="text-gray-600 dark:text-gray-400" />
              <YAxis yAxisId="left" className="text-gray-600 dark:text-gray-400" />
              <YAxis yAxisId="right" orientation="right" className="text-gray-600 dark:text-gray-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid var(--tooltip-border, #e5e7eb)',
                  borderRadius: '0.5rem',
                  color: 'var(--tooltip-text, #111827)'
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="completed" fill="#3b82f6" name="Projects Completed" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="efficiency"
                stroke="#10b981"
                strokeWidth={3}
                name="Team Efficiency %"
                dot={{ fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Skills Radar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Team Skills Assessment</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={skillsData}>
              <PolarGrid className="stroke-gray-300 dark:stroke-gray-600" />
              <PolarAngleAxis dataKey="skill" className="text-gray-600 dark:text-gray-400" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-gray-600 dark:text-gray-400" />
              <Radar name="Team Average" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Radar name="Top Performer" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Legend />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid var(--tooltip-border, #e5e7eb)',
                  borderRadius: '0.5rem',
                  color: 'var(--tooltip-text, #111827)'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TeamPerformance;