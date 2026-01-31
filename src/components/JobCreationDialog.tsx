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
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jobApi } from "@/lib/api";
import type { CreateJobPayload, Job } from "@/types/job";

interface JobCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated: () => void;
  job?: Job | null;
}

export default function JobCreationDialog({
  open,
  onOpenChange,
  onJobCreated,
  job,
}: JobCreationDialogProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const isEditMode = Boolean(job);

  // Form state
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState<"Full-time" | "Internship" | "Contract" | "Part-time">("Internship");
  const [description, setDescription] = useState("");
  const [experienceRequired, setExperienceRequired] = useState("");
  const [minReadinessScore, setMinReadinessScore] = useState("50");
  const [minCGPA, setMinCGPA] = useState("6.0");
  const [minProjects, setMinProjects] = useState("1");

  // Populate form for edit and reset when closed
  useEffect(() => {
    if (open && job) {
      setTitle(job.title || "");
      setLocation(job.location || "");
      setJobType(job.jobType || "Internship");
      setDescription(job.description || "");
      setExperienceRequired(job.experienceRequired || "");
      setMinReadinessScore(String(job.minReadinessScore ?? 50));
      setMinCGPA(String(job.minCGPA ?? 6.0));
      setMinProjects(String(job.minProjects ?? 1));
      return;
    }

    if (!open) {
      setTitle("");
      setLocation("");
      setJobType("Internship");
      setDescription("");
      setExperienceRequired("");
      setMinReadinessScore("50");
      setMinCGPA("6.0");
      setMinProjects("1");
    }
  }, [open, job]);

  const handleSaveJob = async (publishNow: boolean = false) => {
    if (!title.trim() || !location.trim() || !description.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title, location, and job description.",
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
        description,
        experienceRequired: experienceRequired || undefined,
        minReadinessScore: parseInt(minReadinessScore),
        minCGPA: parseFloat(minCGPA),
        minProjects: parseInt(minProjects),
      };

      if (isEditMode && job?._id) {
        await jobApi.updateJob(job._id, payload, token);
        toast({
          title: "Job updated",
          description: "Your changes have been saved.",
        });
      } else {
        const { job: createdJob } = await jobApi.createJob(payload, token);

        // If publish now is selected, publish the job immediately
        if (publishNow) {
          await jobApi.publishJob(createdJob._id, token);
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
            {isEditMode ? "Edit Job Posting" : "Create New Job Posting"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the job details below."
              : "Provide a clear job description and AI will extract key skills automatically."}
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

          {/* Job Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              placeholder="Paste the job description here. AI will extract key skills automatically."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Tip: Include required technologies, responsibilities, and experience.
            </p>
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
          {isEditMode ? (
            <Button onClick={() => handleSaveJob(false)} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => handleSaveJob(false)}
                disabled={isCreating}
              >
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSaveJob(true)}
                disabled={isCreating}
              >
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Sparkles className="mr-2 h-4 w-4" />
                Publish Now
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
