import React, { useState } from 'react';
import { Filter, X, Plus, Save, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FilterConfig {
  minScore?: number;
  maxScore?: number;
  skills?: string[];
  minCGPA?: number;
  maxCGPA?: number;
  minProjects?: number;
  colleges?: string[];
  verified?: boolean;
  githubConnected?: boolean;
  minLeetCodeScore?: number;
  minHackerRankScore?: number;
  yearOfGraduation?: number[];
}

interface SavedFilter {
  id: string;
  name: string;
  config: FilterConfig;
  createdAt: Date;
}

interface AdvancedFiltersProps {
  onApplyFilters: (config: FilterConfig) => void;
  currentFilters: FilterConfig;
  activeStudentCount: number;
}

const popularSkills = [
  'JavaScript', 'Python', 'Java', 'TypeScript', 'React',
  'Node.js', 'Angular', 'Vue.js', 'MongoDB', 'PostgreSQL',
  'MySQL', 'AWS', 'Azure', 'Docker', 'Kubernetes',
  'Git', 'REST API', 'GraphQL', 'Machine Learning', 'AI/ML',
  'Data Science', 'DevOps', 'CI/CD', 'Microservices', 'Redis',
];

const topColleges = [
  'IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur',
  'BITS Pilani', 'NIT Trichy', 'NIT Warangal', 'IIIT Hyderabad', 'DTU Delhi',
  'VIT Vellore', 'Manipal', 'SRM', 'Amity', 'NSIT',
];

export function AdvancedFilters({ onApplyFilters, currentFilters, activeStudentCount }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterConfig>(currentFilters);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [filterName, setFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const updateFilter = (key: keyof FilterConfig, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleSkill = (skill: string) => {
    const currentSkills = filters.skills || [];
    if (currentSkills.includes(skill)) {
      updateFilter('skills', currentSkills.filter(s => s !== skill));
    } else {
      updateFilter('skills', [...currentSkills, skill]);
    }
  };

  const toggleCollege = (college: string) => {
    const currentColleges = filters.colleges || [];
    if (currentColleges.includes(college)) {
      updateFilter('colleges', currentColleges.filter(c => c !== college));
    } else {
      updateFilter('colleges', [...currentColleges, college]);
    }
  };

  const handleApply = () => {
    onApplyFilters(filters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const emptyFilters: FilterConfig = {};
    setFilters(emptyFilters);
    onApplyFilters(emptyFilters);
  };

  const saveCurrentFilter = () => {
    if (!filterName.trim()) return;
    
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName,
      config: filters,
      createdAt: new Date(),
    };
    
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('recruiter-saved-filters', JSON.stringify(updated));
    
    setFilterName('');
    setShowSaveDialog(false);
  };

  const loadSavedFilter = (filter: SavedFilter) => {
    setFilters(filter.config);
    onApplyFilters(filter.config);
    setIsOpen(false);
  };

  const deleteSavedFilter = (id: string) => {
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem('recruiter-saved-filters', JSON.stringify(updated));
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('recruiter-saved-filters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  }, []);

  const activeFilterCount = Object.values(filters).filter(v => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== null;
  }).length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Advanced Filters
          {activeFilterCount > 0 && (
            <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs h-5">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[500px] sm:w-[600px] overflow-hidden">
        <SheetHeader>
          <SheetTitle>Advanced Filters</SheetTitle>
          <SheetDescription>
            Filter {activeStudentCount} students by multiple criteria
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] mt-6 pr-4">
          <div className="space-y-6">
            {/* Saved Filters */}
            {savedFilters.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-3 block">Saved Filters</Label>
                <div className="space-y-2">
                  {savedFilters.map(filter => (
                    <div
                      key={filter.id}
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => loadSavedFilter(filter)}
                    >
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{filter.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSavedFilter(filter.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            )}

            {/* Readiness Score Range */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Readiness Score</Label>
              <div className="space-y-4">
                <div className="px-2">
                  <Slider
                    value={[filters.minScore || 0, filters.maxScore || 100]}
                    onValueChange={([min, max]) => {
                      updateFilter('minScore', min);
                      updateFilter('maxScore', max);
                    }}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>{filters.minScore || 0}</span>
                    <span>{filters.maxScore || 100}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Skills */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Required Skills</Label>
              <div className="flex flex-wrap gap-2">
                {popularSkills.map(skill => (
                  <Badge
                    key={skill}
                    variant={filters.skills?.includes(skill) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill}
                    {filters.skills?.includes(skill) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* CGPA Range */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">CGPA Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Minimum</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={filters.minCGPA || ''}
                    onChange={(e) => updateFilter('minCGPA', parseFloat(e.target.value))}
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Maximum</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={filters.maxCGPA || ''}
                    onChange={(e) => updateFilter('maxCGPA', parseFloat(e.target.value))}
                    placeholder="10.0"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Projects */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Minimum Projects</Label>
              <Input
                type="number"
                min="0"
                value={filters.minProjects || ''}
                onChange={(e) => updateFilter('minProjects', parseInt(e.target.value))}
                placeholder="e.g., 3"
              />
            </div>

            <Separator />

            {/* Colleges */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Colleges</Label>
              <div className="space-y-2">
                {topColleges.map(college => (
                  <div key={college} className="flex items-center space-x-2">
                    <Checkbox
                      id={college}
                      checked={filters.colleges?.includes(college)}
                      onCheckedChange={() => toggleCollege(college)}
                    />
                    <label
                      htmlFor={college}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {college}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Coding Platforms */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Coding Platform Scores</Label>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Min LeetCode Score</Label>
                  <Input
                    type="number"
                    min="0"
                    value={filters.minLeetCodeScore || ''}
                    onChange={(e) => updateFilter('minLeetCodeScore', parseInt(e.target.value))}
                    placeholder="e.g., 500"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Min HackerRank Score</Label>
                  <Input
                    type="number"
                    min="0"
                    value={filters.minHackerRankScore || ''}
                    onChange={(e) => updateFilter('minHackerRankScore', parseInt(e.target.value))}
                    placeholder="e.g., 1000"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Verification Status */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Verification & Integrations</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="verified"
                    checked={filters.verified || false}
                    onCheckedChange={(checked) => updateFilter('verified', checked)}
                  />
                  <label htmlFor="verified" className="text-sm font-medium">
                    Admin Verified Only
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="github"
                    checked={filters.githubConnected || false}
                    onCheckedChange={(checked) => updateFilter('githubConnected', checked)}
                  />
                  <label htmlFor="github" className="text-sm font-medium">
                    GitHub Connected
                  </label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Year of Graduation */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Year of Graduation</Label>
              <Select
                value={filters.yearOfGraduation?.[0]?.toString()}
                onValueChange={(value) => updateFilter('yearOfGraduation', [parseInt(value)])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027, 2028].map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t space-y-2">
          {showSaveDialog ? (
            <div className="flex gap-2">
              <Input
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Filter name..."
                className="flex-1"
              />
              <Button onClick={saveCurrentFilter} size="sm">
                <Save className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(true)}
                className="flex-1"
              >
                <Star className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={handleApply} className="flex-1">
                Apply Filters
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
