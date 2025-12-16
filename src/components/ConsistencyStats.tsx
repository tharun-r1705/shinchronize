/**
 * ConsistencyStats Component
 * 
 * Displays coding consistency metrics with weekly breakdown
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { RefreshButton } from './RefreshButton';
import { 
  Activity, 
  Calendar, 
  TrendingUp, 
  Clock,
  Flame
} from 'lucide-react';

interface WeeklyData {
  weekNumber: number;
  commits: number;
  weekStart: string;
}

interface ConsistencyData {
  totalCommits: number;
  commitsPerWeek: number | string;
  activeWeeks: number;
  totalWeeks: number;
  consistencyPercentage: number | string;
  lastCommitDate?: string;
  daysSinceLastCommit?: number;
  weeklyBreakdown: WeeklyData[];
  consistencyScore: number;
  lastRefreshed?: string;
}

interface ConsistencyStatsProps {
  consistency: ConsistencyData | null;
  onRefresh: () => void;
  loading: boolean;
  readOnly?: boolean;
}

export const ConsistencyStats: React.FC<ConsistencyStatsProps> = ({
  consistency,
  onRefresh,
  loading,
  readOnly = false,
}) => {
  if (!consistency) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Coding Consistency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">No consistency data available</p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    if (score >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Needs Work';
    return 'Getting Started';
  };

  const formatLastCommit = () => {
    if (!consistency.lastCommitDate) return 'Never';
    if (consistency.daysSinceLastCommit === 0) return 'Today';
    if (consistency.daysSinceLastCommit === 1) return 'Yesterday';
    if (consistency.daysSinceLastCommit! <= 7) return `${consistency.daysSinceLastCommit} days ago`;
    if (consistency.daysSinceLastCommit! <= 30) return `${Math.floor(consistency.daysSinceLastCommit! / 7)} weeks ago`;
    return new Date(consistency.lastCommitDate).toLocaleDateString();
  };

  const maxCommits = Math.max(...consistency.weeklyBreakdown.map(w => w.commits), 1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Coding Consistency
            <Badge 
              variant="secondary" 
              className={`ml-2 ${getScoreColor(consistency.consistencyScore)}`}
            >
              {consistency.consistencyScore}/100
            </Badge>
          </CardTitle>
          {!readOnly && (
            <RefreshButton
              onRefresh={onRefresh}
              loading={loading}
              lastRefreshed={consistency.lastRefreshed}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Score Overview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Consistency Score</span>
            <span className={`font-semibold ${getScoreColor(consistency.consistencyScore)}`}>
              {getScoreLabel(consistency.consistencyScore)}
            </span>
          </div>
          <Progress value={consistency.consistencyScore} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
            </div>
            <div className="text-xl font-bold text-blue-600">{consistency.totalCommits}</div>
            <div className="text-xs text-gray-600">Total Commits</div>
            <div className="text-xs text-gray-500">(last 90 days)</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Calendar className="w-4 h-4 text-green-500 mr-1" />
            </div>
            <div className="text-xl font-bold text-green-600">{consistency.activeWeeks}</div>
            <div className="text-xs text-gray-600">Active Weeks</div>
            <div className="text-xs text-gray-500">of {consistency.totalWeeks}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Flame className="w-4 h-4 text-orange-500 mr-1" />
            </div>
            <div className="text-xl font-bold text-orange-600">
              {typeof consistency.commitsPerWeek === 'number' 
                ? consistency.commitsPerWeek.toFixed(1) 
                : consistency.commitsPerWeek}
            </div>
            <div className="text-xs text-gray-600">Commits/Week</div>
            <div className="text-xs text-gray-500">average</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-4 h-4 text-purple-500 mr-1" />
            </div>
            <div className="text-xl font-bold text-purple-600">
              {formatLastCommit()}
            </div>
            <div className="text-xs text-gray-600">Last Commit</div>
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Weekly Activity (Last 13 Weeks)</h4>
          <div className="flex items-end gap-1 h-24">
            {consistency.weeklyBreakdown.map((week, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-1"
                title={`Week ${week.weekNumber}: ${week.commits} commits`}
              >
                <div
                  className={`w-full rounded-t transition-all ${
                    week.commits > 0 ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                  style={{
                    height: `${(week.commits / maxCommits) * 100}%`,
                    minHeight: week.commits > 0 ? '4px' : '2px',
                  }}
                />
                <span className="text-[8px] text-gray-400">{week.weekNumber}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>13 weeks ago</span>
            <span>This week</span>
          </div>
        </div>

        {/* Consistency Percentage */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
          <span className="text-sm text-gray-600">
            You were active <strong className="text-blue-600">
              {consistency.consistencyPercentage}%
            </strong> of the last 13 weeks
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
