/**
 * GitHubProfileCard Component
 * 
 * Displays GitHub profile overview with avatar, stats, and refresh button
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { RefreshButton } from './RefreshButton';
import { Github, MapPin, Link as LinkIcon, Building, Users, GitFork } from 'lucide-react';

interface GitHubProfileData {
  avatar?: string;
  username: string;
  name?: string;
  bio?: string;
  location?: string;
  blog?: string;
  company?: string;
  accountAge: string;
  publicRepos: number;
  followers: number;
  following: number;
  lastRefreshed?: string;
}

interface GitHubProfileCardProps {
  profile: GitHubProfileData | null;
  onRefresh: () => void;
  loading: boolean;
  readOnly?: boolean;
}

export const GitHubProfileCard: React.FC<GitHubProfileCardProps> = ({
  profile,
  onRefresh,
  loading,
  readOnly = false,
}) => {
  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            Profile Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">No GitHub profile connected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            Profile Overview
          </CardTitle>
          {!readOnly && (
            <RefreshButton
              onRefresh={onRefresh}
              loading={loading}
              lastRefreshed={profile.lastRefreshed}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Avatar and Basic Info */}
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar} alt={profile.username} />
              <AvatarFallback>{profile.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">{profile.name || profile.username}</h3>
                <a
                  href={`https://github.com/${profile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Github className="w-4 h-4" />
                </a>
              </div>
              <p className="text-sm text-gray-600">@{profile.username}</p>
              {profile.bio && (
                <p className="text-sm text-gray-700 mt-2">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {profile.company && (
              <div className="flex items-center gap-2 text-gray-700">
                <Building className="w-4 h-4 text-gray-500" />
                <span>{profile.company}</span>
              </div>
            )}
            {profile.location && (
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.blog && (
              <div className="flex items-center gap-2 text-gray-700">
                <LinkIcon className="w-4 h-4 text-gray-500" />
                <a
                  href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {profile.blog}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-700">
              <Users className="w-4 h-4 text-gray-500" />
              <span>Account age: {profile.accountAge}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{profile.publicRepos}</div>
              <div className="text-xs text-gray-600">Repositories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{profile.followers}</div>
              <div className="text-xs text-gray-600">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{profile.following}</div>
              <div className="text-xs text-gray-600">Following</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
