/**
 * OpenSourceStats Component
 * 
 * Displays open source contribution metrics
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { RefreshButton } from './RefreshButton';
import { 
  GitPullRequest, 
  CircleDot, 
  MessageSquare, 
  Users,
  ExternalLink,
  Award
} from 'lucide-react';

interface OpenSourceData {
  pullRequests: {
    opened: number;
    merged: number;
    closed: number;
    total: number;
  };
  issues: {
    opened: number;
    closed: number;
    total: number;
  };
  reviews: {
    given: number;
  };
  contributions: {
    reposContributedTo: number;
    reposList: string[];
  };
  openSourceScore: number;
  lastRefreshed?: string;
}

interface OpenSourceStatsProps {
  openSource: OpenSourceData | null;
  onRefresh: () => void;
  loading: boolean;
  readOnly?: boolean;
}

export const OpenSourceStats: React.FC<OpenSourceStatsProps> = ({
  openSource,
  onRefresh,
  loading,
  readOnly = false,
}) => {
  if (!openSource) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5" />
            Open Source Contributions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">No open source contribution data available</p>
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
    if (score >= 80) return 'Outstanding Contributor';
    if (score >= 60) return 'Active Contributor';
    if (score >= 40) return 'Growing Contributor';
    if (score >= 20) return 'Getting Started';
    return 'Newcomer';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5" />
            Open Source Contributions
            <Badge 
              variant="secondary" 
              className={`ml-2 ${getScoreColor(openSource.openSourceScore)}`}
            >
              {openSource.openSourceScore}/100
            </Badge>
          </CardTitle>
          {!readOnly && (
            <RefreshButton
              onRefresh={onRefresh}
              loading={loading}
              lastRefreshed={openSource.lastRefreshed}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Score Overview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Contribution Score</span>
            <span className={`font-semibold ${getScoreColor(openSource.openSourceScore)}`}>
              {getScoreLabel(openSource.openSourceScore)}
            </span>
          </div>
          <Progress value={openSource.openSourceScore} className="h-2" />
        </div>

        {/* Pull Requests Section */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-purple-500" />
            Pull Requests
          </h4>
          <div className="grid grid-cols-3 gap-4 p-4 bg-purple-50 rounded-lg">
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">
                {openSource.pullRequests.opened}
              </div>
              <div className="text-xs text-gray-600">Opened</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {openSource.pullRequests.merged}
              </div>
              <div className="text-xs text-gray-600">Merged</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-600">
                {openSource.pullRequests.closed}
              </div>
              <div className="text-xs text-gray-600">Closed</div>
            </div>
          </div>
        </div>

        {/* Issues Section */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <CircleDot className="w-4 h-4 text-green-500" />
            Issues
          </h4>
          <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {openSource.issues.opened}
              </div>
              <div className="text-xs text-gray-600">Opened</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {openSource.issues.closed}
              </div>
              <div className="text-xs text-gray-600">Resolved</div>
            </div>
          </div>
        </div>

        {/* Reviews & Contributions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-orange-50 rounded-lg text-center">
            <MessageSquare className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-orange-600">
              {openSource.reviews.given}
            </div>
            <div className="text-xs text-gray-600">Code Reviews</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-blue-600">
              {openSource.contributions.reposContributedTo}
            </div>
            <div className="text-xs text-gray-600">Repos Contributed</div>
          </div>
        </div>

        {/* Contributed Repos List */}
        {openSource.contributions.reposList && openSource.contributions.reposList.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" />
              Recent Contributions
            </h4>
            <div className="space-y-2">
              {openSource.contributions.reposList.slice(0, 5).map((repo, index) => (
                <a
                  key={index}
                  href={`https://github.com/${repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  {repo}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {openSource.pullRequests.total === 0 && openSource.issues.total === 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
            <Award className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Start contributing to open source projects to build your profile!
            </p>
            <a
              href="https://github.com/topics/good-first-issue"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline mt-2 inline-block"
            >
              Find good first issues →
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
