/**
 * GitHubDetails Component
 * 
 * Main container component for GitHub profile integration.
 * Combines all GitHub sub-components and handles API calls.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useToast } from '@/hooks/use-toast';
import { GitHubProfileCard } from './GitHubProfileCard';
import { RepoList } from './RepoList';
import { ConsistencyStats } from './ConsistencyStats';
import { OpenSourceStats } from './OpenSourceStats';
import { 
  Github, 
  Link2, 
  Unlink, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Target
} from 'lucide-react';

const API_BASE = 'http://localhost:5001/api';

interface GitHubData {
  connected: boolean;
  username?: string;
  profile?: any;
  repos?: any;
  consistency?: any;
  openSource?: any;
  readinessScore?: number;
}

interface GitHubDetailsProps {
  token: string;
  readOnly?: boolean;
  studentId?: string; // For recruiter view
  onScoreChange?: (score: number) => void;
}

export const GitHubDetails: React.FC<GitHubDetailsProps> = ({
  token,
  readOnly = false,
  studentId,
  onScoreChange,
}) => {
  const { toast } = useToast();
  const [githubData, setGithubData] = useState<GitHubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [username, setUsername] = useState('');
  const [refreshingCategory, setRefreshingCategory] = useState<string | null>(null);

  // Fetch GitHub data
  const fetchGitHubData = useCallback(async () => {
    try {
      setLoading(true);
      
      const endpoint = studentId 
        ? `${API_BASE}/github-profile/${studentId}`
        : `${API_BASE}/github-profile/data`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch GitHub data');
      }
      
      const data = await response.json();
      setGithubData(data);
      
      if (data.readinessScore && onScoreChange) {
        onScoreChange(data.readinessScore);
      }
      
    } catch (error) {
      console.error('Error fetching GitHub data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch GitHub data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [token, studentId, onScoreChange, toast]);

  useEffect(() => {
    fetchGitHubData();
  }, [fetchGitHubData]);

  // Connect GitHub account
  const handleConnect = async () => {
    if (!username.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a GitHub username',
        variant: 'destructive',
      });
      return;
    }

    try {
      setConnecting(true);
      
      const response = await fetch(`${API_BASE}/github-profile/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to connect GitHub');
      }
      
      toast({
        title: 'Success',
        description: `GitHub account @${username} connected successfully!`,
      });
      
      setUsername('');
      fetchGitHubData();
      
    } catch (error: any) {
      console.error('Error connecting GitHub:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to connect GitHub account',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect GitHub account
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your GitHub account?')) {
      return;
    }

    try {
      setDisconnecting(true);
      
      const response = await fetch(`${API_BASE}/github-profile/disconnect`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to disconnect GitHub');
      }
      
      toast({
        title: 'Success',
        description: 'GitHub account disconnected',
      });
      
      setGithubData({ connected: false });
      
      if (onScoreChange) {
        onScoreChange(data.newReadinessScore || 0);
      }
      
    } catch (error: any) {
      console.error('Error disconnecting GitHub:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to disconnect GitHub account',
        variant: 'destructive',
      });
    } finally {
      setDisconnecting(false);
    }
  };

  // Refresh individual category
  const refreshCategory = async (category: 'profile' | 'repos' | 'consistency' | 'open-source' | 'all') => {
    try {
      setRefreshingCategory(category);
      
      const response = await fetch(`${API_BASE}/github-profile/refresh/${category}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to refresh ${category}`);
      }
      
      toast({
        title: 'Refreshed',
        description: data.message || `${category} data updated`,
      });
      
      // Update local state with new data
      if (category === 'all') {
        fetchGitHubData();
      } else {
        setGithubData(prev => {
          if (!prev) return prev;
          
          const updated = { ...prev };
          if (category === 'profile') updated.profile = data.data;
          if (category === 'repos') updated.repos = data.data;
          if (category === 'consistency') updated.consistency = data.data;
          if (category === 'open-source') updated.openSource = data.data;
          updated.readinessScore = data.readinessScore;
          
          return updated;
        });
        
        if (data.readinessScore && onScoreChange) {
          onScoreChange(data.readinessScore);
        }
      }
      
    } catch (error: any) {
      console.error(`Error refreshing ${category}:`, error);
      toast({
        title: 'Error',
        description: error.message || `Failed to refresh ${category}`,
        variant: 'destructive',
      });
    } finally {
      setRefreshingCategory(null);
    }
  };

  // Get score color and label
  const getScoreInfo = (score: number) => {
    if (score >= 80) return { color: 'text-green-600', bg: 'bg-green-100', label: 'Excellent' };
    if (score >= 60) return { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Good' };
    if (score >= 40) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Fair' };
    if (score >= 20) return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Needs Work' };
    return { color: 'text-red-600', bg: 'bg-red-100', label: 'Getting Started' };
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">Loading GitHub data...</p>
        </CardContent>
      </Card>
    );
  }

  // Not connected state (student view only)
  if (!readOnly && (!githubData || !githubData.connected)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="w-6 h-6" />
            Connect GitHub Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Connect your GitHub account to showcase your projects, contributions, and coding consistency
            to recruiters. Your readiness score will automatically update based on your GitHub activity.
          </p>
          
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter your GitHub username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
              disabled={connecting}
            />
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              What happens when you connect?
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Your public repositories will be displayed</li>
              <li>• Coding consistency metrics will be calculated</li>
              <li>• Open source contributions will be tracked</li>
              <li>• Your placement readiness score will be updated</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not connected state (recruiter view)
  if (readOnly && (!githubData || !githubData.connected)) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Github className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">This student has not connected their GitHub account</p>
        </CardContent>
      </Card>
    );
  }

  // Connected state
  const scoreInfo = getScoreInfo(githubData?.readinessScore || 0);

  return (
    <div className="space-y-6">
      {/* Header with Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Github className="w-6 h-6" />
              GitHub Profile
              <Badge variant="outline" className="ml-2">
                @{githubData?.username}
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-4">
              {/* Readiness Score */}
              <div className={`px-4 py-2 rounded-lg ${scoreInfo.bg} flex items-center gap-2`}>
                <Target className={`w-5 h-5 ${scoreInfo.color}`} />
                <div>
                  <div className={`text-lg font-bold ${scoreInfo.color}`}>
                    {githubData?.readinessScore || 0}/100
                  </div>
                  <div className="text-xs text-gray-600">Readiness Score</div>
                </div>
              </div>
              
              {/* Actions */}
              {!readOnly && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshCategory('all')}
                    disabled={refreshingCategory === 'all'}
                  >
                    {refreshingCategory === 'all' ? (
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-1" />
                    )}
                    Refresh All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Unlink className="w-4 h-4 mr-1" />
                    Disconnect
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Readiness Score Breakdown */}
      {!readOnly && githubData?.readinessScore !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5" />
              Placement Readiness Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Overall Score</span>
                <span className={`font-semibold ${scoreInfo.color}`}>
                  {scoreInfo.label}
                </span>
              </div>
              <Progress value={githubData.readinessScore} className="h-3" />
            </div>
            <p className="text-sm text-gray-600">
              This score is automatically calculated based on your GitHub activity including
              repository quality, coding consistency, and open source contributions.
              Keep coding regularly to improve your score!
            </p>
          </CardContent>
        </Card>
      )}

      {/* GitHub Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <GitHubProfileCard
          profile={githubData?.profile}
          onRefresh={() => refreshCategory('profile')}
          loading={refreshingCategory === 'profile'}
          readOnly={readOnly}
        />

        {/* Consistency Stats */}
        <ConsistencyStats
          consistency={githubData?.consistency}
          onRefresh={() => refreshCategory('consistency')}
          loading={refreshingCategory === 'consistency'}
          readOnly={readOnly}
        />
      </div>

      {/* Repository List (Full Width) */}
      <RepoList
        reposData={githubData?.repos}
        onRefresh={() => refreshCategory('repos')}
        loading={refreshingCategory === 'repos'}
        readOnly={readOnly}
      />

      {/* Open Source Stats */}
      <OpenSourceStats
        openSource={githubData?.openSource}
        onRefresh={() => refreshCategory('open-source')}
        loading={refreshingCategory === 'open-source'}
        readOnly={readOnly}
      />
    </div>
  );
};
