/**
 * RepoList Component
 * 
 * Displays GitHub repositories with details and refresh button
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { RefreshButton } from './RefreshButton';
import { 
  GitFork, 
  Star, 
  ExternalLink, 
  Code, 
  ChevronDown, 
  ChevronUp,
  Calendar,
  FolderGit2
} from 'lucide-react';

interface Repository {
  id: number;
  name: string;
  fullName: string;
  description?: string;
  language?: string;
  stars: number;
  forks: number;
  isFork: boolean;
  url: string;
  topics?: string[];
  updatedAt: string;
  pushedAt: string;
}

interface ReposData {
  repos: Repository[];
  totalCount: number;
  originalRepos: number;
  forkedRepos: number;
  totalStars: number;
  totalForks: number;
  topLanguages: { language: string; count: number }[];
  lastRefreshed?: string;
}

interface RepoListProps {
  reposData: ReposData | null;
  onRefresh: () => void;
  loading: boolean;
  readOnly?: boolean;
}

const languageColors: { [key: string]: string } = {
  JavaScript: 'bg-yellow-400',
  TypeScript: 'bg-blue-600',
  Python: 'bg-green-500',
  Java: 'bg-red-500',
  'C++': 'bg-pink-500',
  C: 'bg-gray-600',
  Go: 'bg-cyan-500',
  Rust: 'bg-orange-500',
  Ruby: 'bg-red-600',
  PHP: 'bg-indigo-400',
  Swift: 'bg-orange-400',
  Kotlin: 'bg-purple-500',
  HTML: 'bg-orange-600',
  CSS: 'bg-blue-500',
  Shell: 'bg-green-600',
};

export const RepoList: React.FC<RepoListProps> = ({
  reposData,
  onRefresh,
  loading,
  readOnly = false,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<'all' | 'original' | 'forked'>('all');

  if (!reposData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5" />
            Repositories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">No repository data available</p>
        </CardContent>
      </Card>
    );
  }

  const filteredRepos = reposData.repos.filter(repo => {
    if (filter === 'original') return !repo.isFork;
    if (filter === 'forked') return repo.isFork;
    return true;
  });

  const displayRepos = showAll ? filteredRepos : filteredRepos.slice(0, 6);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5" />
            Repositories
            <Badge variant="secondary" className="ml-2">{reposData.totalCount}</Badge>
          </CardTitle>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open('https://github.com/new', '_blank')}
              >
                Add Project from GitHub
              </Button>
              <RefreshButton
                onRefresh={onRefresh}
                loading={loading}
                lastRefreshed={reposData.lastRefreshed}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">{reposData.originalRepos}</div>
            <div className="text-xs text-gray-600">Original</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">{reposData.forkedRepos}</div>
            <div className="text-xs text-gray-600">Forked</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-600">{reposData.totalStars}</div>
            <div className="text-xs text-gray-600">Total Stars</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">{reposData.totalForks}</div>
            <div className="text-xs text-gray-600">Total Forks</div>
          </div>
        </div>

        {/* Top Languages */}
        {reposData.topLanguages && reposData.topLanguages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {reposData.topLanguages.map(({ language, count }) => (
              <Badge
                key={language}
                variant="outline"
                className="flex items-center gap-1"
              >
                <span 
                  className={`w-2 h-2 rounded-full ${languageColors[language] || 'bg-gray-400'}`}
                />
                {language} ({count})
              </Badge>
            ))}
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All ({reposData.totalCount})
          </Button>
          <Button
            size="sm"
            variant={filter === 'original' ? 'default' : 'outline'}
            onClick={() => setFilter('original')}
          >
            Original ({reposData.originalRepos})
          </Button>
          <Button
            size="sm"
            variant={filter === 'forked' ? 'default' : 'outline'}
            onClick={() => setFilter('forked')}
          >
            Forked ({reposData.forkedRepos})
          </Button>
        </div>

        {/* Repo List */}
        <div className="space-y-3">
          {displayRepos.map(repo => (
            <div
              key={repo.id}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {repo.name}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {repo.isFork && (
                      <Badge variant="secondary" className="text-xs">
                        <GitFork className="w-3 h-3 mr-1" />
                        Fork
                      </Badge>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span 
                          className={`w-2 h-2 rounded-full ${languageColors[repo.language] || 'bg-gray-400'}`}
                        />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {repo.stars}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3 h-3" />
                      {repo.forks}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Updated {formatDate(repo.updatedAt)}
                    </span>
                  </div>
                  {repo.topics && repo.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {repo.topics.slice(0, 5).map(topic => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show More/Less */}
        {filteredRepos.length > 6 && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => setShowAll(!showAll)}
              className="gap-1"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show All ({filteredRepos.length})
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
