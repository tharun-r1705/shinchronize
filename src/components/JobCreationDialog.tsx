import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jobApi } from "@/lib/api";
import type { CreateJobPayload } from "@/types/job";

interface JobCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated: () => void;
}

export default function JobCreationDialog({
  open,
  onOpenChange,
  onJobCreated,
}: JobCreationDialogProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState<"Full-time" | "Internship" | "Contract" | "Part-time">("Internship");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newPreferredSkill, setNewPreferredSkill] = useState("");
  const [experienceRequired, setExperienceRequired] = useState("");
  const [minReadinessScore, setMinReadinessScore] = useState("50");
  const [minCGPA, setMinCGPA] = useState("6.0");
  const [minProjects, setMinProjects] = useState("1");

  // AI-generated content preview
  const [aiDescription, setAiDescription] = useState("");
  const [aiResponsibilities, setAiResponsibilities] = useState<string[]>([]);
  const [aiQualifications, setAiQualifications] = useState<string[]>([]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTitle("");
      setLocation("");
      setJobType("Internship");
      setRequiredSkills([]);
      setPreferredSkills([]);
      setExperienceRequired("");
      setMinReadinessScore("50");
      setMinCGPA("6.0");
      setMinProjects("1");
      setAiDescription("");
      setAiResponsibilities([]);
      setAiQualifications([]);
    }
  }, [open]);

  const addRequiredSkill = () => {
    if (newSkill.trim() && !requiredSkills.includes(newSkill.trim())) {
      setRequiredSkills([...requiredSkills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const addPreferredSkill = () => {
    if (newPreferredSkill.trim() && !preferredSkills.includes(newPreferredSkill.trim())) {
      setPreferredSkills([...preferredSkills, newPreferredSkill.trim()]);
      setNewPreferredSkill("");
    }
  };

  const removeRequiredSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
  };

  const removePreferredSkill = (skill: string) => {
    setPreferredSkills(preferredSkills.filter((s) => s !== skill));
  };

  const handleCreateJob = async (publishNow: boolean = false) => {
    if (!title.trim() || !location.trim() || requiredSkills.length === 0) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title, location, and at least one required skill.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const payload: CreateJobPayload = {
        title,
        location,
        jobType,
        requiredSkills,
        preferredSkills: preferredSkills.length > 0 ? preferredSkills : undefined,
        experienceRequired: experienceRequired || undefined,
        minReadinessScore: parseInt(minReadinessScore),
        minCGPA: parseFloat(minCGPA),
        minProjects: parseInt(minProjects),
      };

      const { job } = await jobApi.createJob(payload, token);

      // If publish now is selected, publish the job immediately
      if (publishNow) {
        await jobApi.publishJob(job._id, token);
        toast({
          title: "Job published successfully!",
          description: "AI is now matching students to this job. This may take a few moments.",
        });
      } else {
        toast({
          title: "Job created as draft",
          description: "You can publish it later from the job list.",
        });
      }

      onJobCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error creating job",
        description: error.message || "Failed to create job",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Create New Job Posting
          </DialogTitle>
          <DialogDescription>
            Fill in the basic details and AI will help generate a professional job description.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Basic Information */}
          <div className="space-y-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Frontend Developer Intern"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="e.g., Bangalore"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobType">Job Type</Label>
              <Select value={jobType} onValueChange={(value: any) => setJobType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Internship">Internship</SelectItem>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Required Skills */}
          <div className="space-y-2">
            <Label>Required Skills *</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a required skill"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRequiredSkill();
                  }
                }}
              />
              <Button type="button" onClick={addRequiredSkill} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {requiredSkills.map((skill) => (
                <Badge key={skill} variant="default" className="flex items-center gap-1">
                  {skill}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeRequiredSkill(skill)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Preferred Skills */}
          <div className="space-y-2">
            <Label>Preferred Skills (Optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a preferred skill"
                value={newPreferredSkill}
                onChange={(e) => setNewPreferredSkill(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPreferredSkill();
                  }
                }}
              />
              <Button type="button" onClick={addPreferredSkill} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {preferredSkills.map((skill) => (
                <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                  {skill}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removePreferredSkill(skill)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <Label htmlFor="experience">Experience Required (Optional)</Label>
            <Input
              id="experience"
              placeholder="e.g., 0-1 years, Freshers welcome"
              value={experienceRequired}
              onChange={(e) => setExperienceRequired(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minReadiness">Min Readiness Score</Label>
              <Input
                id="minReadiness"
                type="number"
                min="0"
                max="100"
                value={minReadinessScore}
                onChange={(e) => setMinReadinessScore(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minCGPA">Min CGPA</Label>
              <Input
                id="minCGPA"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={minCGPA}
                onChange={(e) => setMinCGPA(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minProjects">Min Projects</Label>
              <Input
                id="minProjects"
                type="number"
                min="0"
                value={minProjects}
                onChange={(e) => setMinProjects(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleCreateJob(false)}
            disabled={isCreating}
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save as Draft
          </Button>
          <Button
            onClick={() => handleCreateJob(true)}
            disabled={isCreating}
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Sparkles className="mr-2 h-4 w-4" />
            Publish Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
