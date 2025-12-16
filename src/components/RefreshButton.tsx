/**
 * RefreshButton Component
 * 
 * Reusable button for refreshing individual GitHub categories
 */

import React from 'react';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
  onRefresh: () => void;
  loading: boolean;
  label?: string;
  lastRefreshed?: Date | string;
  disabled?: boolean;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  loading,
  label = 'Refresh',
  lastRefreshed,
  disabled = false,
}) => {
  const formatLastRefreshed = (date: Date | string) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="flex items-center gap-2">
      {lastRefreshed && (
        <span className="text-xs text-gray-500">
          Updated: {formatLastRefreshed(lastRefreshed)}
        </span>
      )}
      <Button
        onClick={onRefresh}
        disabled={loading || disabled}
        size="sm"
        variant="outline"
        className="gap-1"
      >
        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        {label}
      </Button>
    </div>
  );
};
