import React, { useEffect, useState } from 'react';
import { Trophy, Award, Star, Zap, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Achievement {
  _id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlockedAt?: string;
}

interface AchievementsProps {
  studentId?: string;
}

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-600',
};

const rarityBorders = {
  common: 'border-gray-400',
  rare: 'border-blue-400',
  epic: 'border-purple-400',
  legendary: 'border-yellow-400',
};

export function AchievementShowcase({ studentId }: AchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRarity, setSelectedRarity] = useState<string>('all');

  useEffect(() => {
    fetchAchievements();
  }, [studentId]);

  const fetchAchievements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/students/${studentId || 'me'}/achievements`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAchievements(data.data.achievements || []);
        setTotalPoints(data.data.totalPoints || 0);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const unlockedCount = achievements.length;
  const totalPossible = 42; // Total number of achievements defined

  const filteredAchievements =
    selectedRarity === 'all'
      ? achievements
      : achievements.filter((a) => a.rarity === selectedRarity);

  const byRarity = achievements.reduce(
    (acc, a) => {
      acc[a.rarity] = (acc[a.rarity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Loading your achievements...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Points</CardDescription>
            <CardTitle className="text-3xl">{totalPoints.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Points earned</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unlocked</CardDescription>
            <CardTitle className="text-3xl">
              {unlockedCount}/{totalPossible}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={(unlockedCount / totalPossible) * 100} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Legendary</CardDescription>
            <CardTitle className="text-3xl">{byRarity.legendary || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Rare achievements</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Recent</CardDescription>
            <CardTitle className="text-2xl truncate">
              {achievements[0]?.name || 'None yet'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-muted-foreground">
              {achievements[0]?.unlockedAt
                ? new Date(achievements[0].unlockedAt).toLocaleDateString()
                : 'Start earning!'}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Achievements</CardTitle>
              <CardDescription>Unlock achievements by completing tasks</CardDescription>
            </div>
            <Tabs value={selectedRarity} onValueChange={setSelectedRarity}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="common">Common</TabsTrigger>
                <TabsTrigger value="rare">Rare</TabsTrigger>
                <TabsTrigger value="epic">Epic</TabsTrigger>
                <TabsTrigger value="legendary">Legendary</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={cn(
                      'relative overflow-hidden border-2 transition-all hover:shadow-lg hover:scale-105',
                      rarityBorders[achievement.rarity]
                    )}
                  >
                    <div
                      className={cn(
                        'absolute inset-0 opacity-10 bg-gradient-to-br',
                        rarityColors[achievement.rarity]
                      )}
                    />
                    <CardHeader className="relative pb-3">
                      <div className="flex items-start justify-between">
                        <div className="text-4xl">{achievement.icon}</div>
                        <Badge
                          variant="outline"
                          className={cn('font-semibold', {
                            'bg-gray-100 text-gray-700': achievement.rarity === 'common',
                            'bg-blue-100 text-blue-700': achievement.rarity === 'rare',
                            'bg-purple-100 text-purple-700': achievement.rarity === 'epic',
                            'bg-yellow-100 text-yellow-700': achievement.rarity === 'legendary',
                          })}
                        >
                          {achievement.rarity}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{achievement.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {achievement.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative pt-0">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold">{achievement.points} pts</span>
                        </div>
                        {achievement.unlockedAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {filteredAchievements.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Lock className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No {selectedRarity !== 'all' ? selectedRarity : ''} achievements unlocked yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Keep completing tasks to unlock achievements!
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
