import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  studentApi,
  CodingProfilesPayload,
  StudentProfileDTO,
  UpdateStudentProfilePayload,
  LinkedInProfileAutofill,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { StudentNavbar } from "@/components/StudentNavbar";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  UserCog,
  Upload,
  AlertCircle,
  Link2,
  LogOut,
  FileDown,
} from "lucide-react";

// Predefined list of common tech skills
const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C", "C#", "Go", "Rust", "PHP",
  "React", "Angular", "Vue.js", "Next.js", "Svelte", "Node.js", "Express.js", "Django", "Flask", "Spring Boot",
  "HTML", "CSS", "Tailwind CSS", "Bootstrap", "Sass", "Material-UI", "Ant Design",
  "MongoDB", "PostgreSQL", "MySQL", "Redis", "Firebase", "Supabase", "SQL", "NoSQL",
  "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "CI/CD", "Jenkins", "GitHub Actions",
  "Git", "GitHub", "GitLab", "Bitbucket", "Linux", "Bash", "Shell Scripting",
  "REST API", "GraphQL", "WebSockets", "Microservices", "Serverless",
  "Machine Learning", "Deep Learning", "Artificial Intelligence", "Neural Networks", "Computer Vision", "NLP", "Natural Language Processing",
  "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "OpenCV", "Hugging Face", "LangChain",
  "Pandas", "NumPy", "Matplotlib", "Seaborn", "Jupyter", "Data Science", "Data Analysis",
  "Large Language Models", "LLM", "GPT", "Transformers", "BERT", "Prompt Engineering",
  "Reinforcement Learning", "GANs", "CNN", "RNN", "LSTM", "Transfer Learning",
  "Data Structures", "Algorithms", "System Design", "OOP", "Design Patterns",
  "Agile", "Scrum", "JIRA", "Figma", "Adobe XD", "UI/UX Design",
  "Testing", "Jest", "Mocha", "Pytest", "Selenium", "Cypress",
  "Android", "iOS", "React Native", "Flutter", "Swift", "Kotlin",
  "Blockchain", "Solidity", "Web3", "Ethereum", "Smart Contracts",
  "DevOps", "Terraform", "Ansible", "Nginx", "Apache"
].sort();

const DEFAULT_FORM_STATE = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  college: "",
  branch: "",
  year: "",
  graduationYear: "",
  cgpa: "",
  phone: "",
  location: "",
  portfolioUrl: "",
  linkedinUrl: "",
  githubUrl: "",
  resumeUrl: "",
  leetcodeUrl: "",
  hackerrankUrl: "",
  headline: "",
  summary: "",
  skills: "",
  avatarUrl: "",
};

type FormState = typeof DEFAULT_FORM_STATE;

type CodingProfiles = CodingProfilesPayload;

const formatDateForInput = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const extractLeetCodeUsername = (value: string) => {
  if (!value) return "";
  let normalized = value.trim();
  if (!normalized) return "";
  if (!normalized.startsWith("http")) {
    normalized = `https://${normalized}`;
  }

  try {
    const url = new URL(normalized);
    if (!url.hostname.includes("leetcode")) {
      return value.trim();
    }
    const segments = url.pathname
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);
    if (segments.length === 0) {
      return "";
    }
    if (segments[0] === "u" && segments[1]) {
      return segments[1].replace(/[^a-zA-Z0-9_-]/g, "");
    }
    return segments[segments.length - 1].replace(/[^a-zA-Z0-9_-]/g, "");
  } catch (error) {
    return value.trim();
  }
};

const extractHackerRankUsername = (value: string) => {
  if (!value) return "";
  let normalized = value.trim();
  if (!normalized) return "";
  if (!normalized.startsWith("http")) {
    normalized = `https://${normalized}`;
  }
  try {
    const url = new URL(normalized);
    if (!url.hostname.includes("hackerrank")) {
      return value.trim();
    }
    const segments = url.pathname
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);
    if (segments.length === 0) {
      return "";
    }
    const profileIndex = segments.findIndex((segment) => segment === "profile");
    if (profileIndex !== -1 && segments[profileIndex + 1]) {
      return segments[profileIndex + 1].replace(/[^a-zA-Z0-9_-]/g, "");
    }
    return segments[segments.length - 1].replace(/[^a-zA-Z0-9_-]/g, "");
  } catch (error) {
    return value.trim();
  }
};

const StudentProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [student, setStudent] = useState<StudentProfileDTO | null>(null);
  const [codingProfiles, setCodingProfiles] = useState<CodingProfiles | null>(null);
  const [importingLinkedIn, setImportingLinkedIn] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const linkedinInputRef = useRef<HTMLInputElement | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const formatSkills = (skills?: string[] | null) => {
    if (!skills || skills.length === 0) return "";
    return skills.join(", ");
  };

  const hydrateForm = useCallback((data: StudentProfileDTO) => {
    setStudent(data);
    setCodingProfiles(data?.codingProfiles || null);
    setFormState({
      firstName: data?.firstName || data?.name?.split(" ")[0] || "",
      lastName: data?.lastName || (data?.name?.split(" ").slice(1).join(" ") || ""),
      dateOfBirth: formatDateForInput(data?.dateOfBirth),
      gender: data?.gender || "",
      college: data?.college || "",
      branch: data?.branch || "",
      year: data?.year || "",
      graduationYear: data?.graduationYear ? String(data.graduationYear) : "",
      cgpa: data?.cgpa ? String(data.cgpa) : "",
      phone: data?.phone || "",
      location: data?.location || "",
      portfolioUrl: data?.portfolioUrl || "",
      linkedinUrl: data?.linkedinUrl || "",
      githubUrl: data?.githubUrl || "",
      resumeUrl: data?.resumeUrl || "",
      leetcodeUrl:
        data?.leetcodeUrl || (data?.codingProfiles?.leetcode ? `https://leetcode.com/${data.codingProfiles.leetcode}` : ""),
      hackerrankUrl:
        data?.hackerrankUrl ||
        (data?.codingProfiles?.hackerrank ? `https://www.hackerrank.com/profile/${data.codingProfiles.hackerrank}` : ""),
      headline: data?.headline || "",
      summary: data?.summary || "",
      skills: formatSkills(data?.skills),
      avatarUrl: data?.avatarUrl || "",
    });
    setAvatarPreview(data?.avatarUrl || "");
    // Initialize selected skills
    if (data?.skills && data.skills.length > 0) {
      setSelectedSkills(data.skills);
    }
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/student/login");
          return;
        }
        const profile = await studentApi.getProfile(token);
        hydrateForm(profile);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Please try again";
        toast({
          title: "Failed to load profile",
          description: message,
          variant: "destructive",
        });
        navigate("/student/login");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [hydrateForm, navigate, toast]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (value: string) => {
    setFormState((prev) => ({ ...prev, gender: value }));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormState((prev) => ({ ...prev, avatarUrl: result }));
      setAvatarPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const buildSkillsString = (existingSkills: string, importedSkills?: string[]) => {
    const current = existingSkills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
    const merged = new Set(current);
    (importedSkills || []).forEach((skill) => {
      if (skill && skill.trim()) {
        merged.add(skill.trim());
      }
    });
    return Array.from(merged).join(', ');
  };

  const applyLinkedInProfile = (profile: LinkedInProfileAutofill) => {
    setFormState((prev) => ({
      ...prev,
      firstName: profile.firstName || prev.firstName,
      lastName: profile.lastName || prev.lastName,
      headline: profile.headline || prev.headline,
      summary: profile.summary || prev.summary,
      location: profile.location || prev.location,
      linkedinUrl: profile.linkedinUrl || prev.linkedinUrl,
      phone: profile.phone || prev.phone,
      skills: buildSkillsString(prev.skills, profile.skills),
    }));

    const filledFields: string[] = [];
    if (profile.firstName || profile.lastName) filledFields.push('name');
    if (profile.headline) filledFields.push('headline');
    if (profile.summary) filledFields.push('summary');
    if (profile.location) filledFields.push('location');
    if (profile.linkedinUrl) filledFields.push('LinkedIn URL');
    if (profile.skills && profile.skills.length) filledFields.push('skills');

    setImportSummary(
      filledFields.length
        ? `Autofilled: ${filledFields.join(', ')}`
        : 'LinkedIn PDF processed but no new fields detected.'
    );
  };

  const handleLinkedInUploadClick = () => {
    setImportSummary(null);
    linkedinInputRef.current?.click();
  };

  const handleLinkedInFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportingLinkedIn(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/student/login');
        return;
      }

      const formData = new FormData();
      formData.append('linkedinPdf', file);
      const response = await studentApi.importLinkedInProfile(formData, token);
      applyLinkedInProfile(response.profile || {});
      toast({
        title: 'LinkedIn data imported',
        description: 'Review the autofilled fields before saving.',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to parse LinkedIn PDF';
      toast({
        title: 'Import failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setImportingLinkedIn(false);
      if (linkedinInputRef.current) {
        linkedinInputRef.current.value = '';
      }
    }
  };

  // Sync selected skills with form state
  useEffect(() => {
    if (formState.skills) {
      const skills = formState.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      setSelectedSkills(skills);
    }
  }, []);

  // Update form state when selected skills change
  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      skills: selectedSkills.join(", ")
    }));
  }, [selectedSkills]);

  const skillsArray = useMemo(() => {
    if (!formState.skills) return [] as string[];
    return formState.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }, [formState.skills]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/student/login");
        return;
      }

      const leetcodeUsername = extractLeetCodeUsername(formState.leetcodeUrl);
      const hackerrankUsername = extractHackerRankUsername(formState.hackerrankUrl);

      const updatedCodingProfiles: CodingProfiles = {
        ...(codingProfiles || {}),
        leetcode: leetcodeUsername,
        hackerrank: hackerrankUsername,
      };

      const payload: UpdateStudentProfilePayload = {
        name: `${formState.firstName} ${formState.lastName}`.trim(),
        firstName: formState.firstName.trim(),
        lastName: formState.lastName.trim(),
        dateOfBirth: formState.dateOfBirth || null,
        gender: formState.gender,
        college: formState.college,
        branch: formState.branch,
        year: formState.year,
        graduationYear: formState.graduationYear ? Number(formState.graduationYear) : undefined,
        cgpa: formState.cgpa ? Number(formState.cgpa) : undefined,
        phone: formState.phone,
        location: formState.location,
        portfolioUrl: formState.portfolioUrl,
        linkedinUrl: formState.linkedinUrl,
        githubUrl: formState.githubUrl,
        resumeUrl: formState.resumeUrl,
        leetcodeUrl: formState.leetcodeUrl,
        hackerrankUrl: formState.hackerrankUrl,
        headline: formState.headline,
        summary: formState.summary,
        skills: skillsArray,
        avatarUrl: formState.avatarUrl,
        codingProfiles: updatedCodingProfiles,
      };

      const response = await studentApi.updateProfile(payload, token);
      hydrateForm(response.student);
      toast({
        title: "Profile updated",
        description: "Your information has been saved successfully.",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again";
      toast({
        title: "Failed to save profile",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <StudentNavbar />

      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <Button
          variant="ghost"
          className="px-0 text-muted-foreground hover:text-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Student Profile</h2>
            <p className="text-muted-foreground">
              Keep your profile up to date to showcase your readiness to recruiters.
            </p>
          </div>
          {student?.isProfileComplete ? (
            <Badge className="bg-green-100 text-green-700 border border-green-200">
              <CheckCircle2 className="w-4 h-4 mr-1" /> Profile Complete
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-400 text-amber-600">
              <AlertCircle className="w-4 h-4 mr-1" /> Add more details to complete your profile
            </Badge>
          )}
        </div>

        <input
          ref={linkedinInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleLinkedInFileChange}
        />

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="w-5 h-5 text-primary" />
              LinkedIn Autofill
            </CardTitle>
            <CardDescription>
              Upload the LinkedIn PDF export to prefill your headline, summary, and skills.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              We only read the PDF in-memory; nothing is stored until you choose to save your profile.
              {importSummary && (
                <p className="text-foreground mt-2">{importSummary}</p>
              )}
            </div>
            <Button onClick={handleLinkedInUploadClick} disabled={importingLinkedIn} className="gap-2">
              {importingLinkedIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Upload LinkedIn PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-primary" />
              Personal Details
            </CardTitle>
            <CardDescription>
              Provide basic information that helps recruiters get to know you better.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={avatarPreview} alt="Profile avatar" />
                  <AvatarFallback>
                    {(formState.firstName?.[0] || "S").toUpperCase()}
                    {(formState.lastName?.[0] || "T").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="w-4 h-4" />
                  <label className="cursor-pointer">
                    Upload photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </Button>
              </div>
              <div className="grid gap-4 flex-1 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    value={formState.firstName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    value={formState.lastName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dateOfBirth">Date of birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    name="dateOfBirth"
                    value={formState.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Gender</Label>
                  <Select value={formState.gender} onValueChange={handleGenderChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+91 98765 43210"
                    value={formState.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="City, Country"
                    value={formState.location}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="college">College</Label>
                <Input
                  id="college"
                  name="college"
                  placeholder="Your college name"
                  value={formState.college}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="branch">Department / Branch</Label>
                <Input
                  id="branch"
                  name="branch"
                  placeholder="Computer Science"
                  value={formState.branch}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="year">Year of study</Label>
                <Input
                  id="year"
                  name="year"
                  placeholder="3rd Year"
                  value={formState.year}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="graduationYear">Graduation year</Label>
                <Input
                  id="graduationYear"
                  name="graduationYear"
                  placeholder="2026"
                  value={formState.graduationYear}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cgpa">CGPA / GPA</Label>
                <Input
                  id="cgpa"
                  name="cgpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="8.5"
                  value={formState.cgpa}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-muted-foreground">Enter on a scale of 10 (e.g., 8.5)</p>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="headline">Professional headline</Label>
              <Input
                id="headline"
                name="headline"
                placeholder="Full-stack developer passionate about AI"
                value={formState.headline}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="summary">About you</Label>
              <Textarea
                id="summary"
                name="summary"
                placeholder="Share a short summary about your strengths, interests and career goals."
                value={formState.summary}
                onChange={handleInputChange}
                rows={5}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Online Presence
            </CardTitle>
            <CardDescription>
              Add links to help recruiters explore your portfolio and achievements quickly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="portfolioUrl">Portfolio / Personal site</Label>
                <Input
                  id="portfolioUrl"
                  name="portfolioUrl"
                  placeholder="https://yourdomain.com"
                  value={formState.portfolioUrl}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="linkedinUrl">LinkedIn</Label>
                <Input
                  id="linkedinUrl"
                  name="linkedinUrl"
                  placeholder="https://linkedin.com/in/username"
                  value={formState.linkedinUrl}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="githubUrl">GitHub</Label>
                <Input
                  id="githubUrl"
                  name="githubUrl"
                  placeholder="https://github.com/username"
                  value={formState.githubUrl}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="resumeUrl">Resume link</Label>
                <Input
                  id="resumeUrl"
                  name="resumeUrl"
                  placeholder="https://drive.google.com/..."
                  value={formState.resumeUrl}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="leetcodeUrl">LeetCode profile</Label>
                <Input
                  id="leetcodeUrl"
                  name="leetcodeUrl"
                  placeholder="https://leetcode.com/username"
                  value={formState.leetcodeUrl}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hackerrankUrl">HackerRank profile</Label>
                <Input
                  id="hackerrankUrl"
                  name="hackerrankUrl"
                  placeholder="https://www.hackerrank.com/profile/username"
                  value={formState.hackerrankUrl}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>
              Add comma separated skills to highlight your expertise areas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skills">Skills</Label>
              <Popover open={skillDropdownOpen} onOpenChange={setSkillDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={skillDropdownOpen}
                    className="w-full justify-between h-auto min-h-[40px] py-2"
                  >
                    <span className="text-muted-foreground text-sm">
                      {selectedSkills.length > 0 ? `${selectedSkills.length} skills selected` : "Select or type skills..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search or type a skill..." 
                      value={skillInput}
                      onValueChange={setSkillInput}
                    />
                    <CommandEmpty>
                      <div className="p-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            if (skillInput.trim()) {
                              setSelectedSkills(prev => [...prev, skillInput.trim()]);
                              setSkillInput("");
                              setSkillDropdownOpen(false);
                            }
                          }}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Add "{skillInput}"
                        </Button>
                      </div>
                    </CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {COMMON_SKILLS
                        .filter(skill => !selectedSkills.includes(skill))
                        .map((skill) => (
                          <CommandItem
                            key={skill}
                            value={skill}
                            onSelect={() => {
                              setSelectedSkills(prev => [...prev, skill]);
                              setSkillInput("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedSkills.includes(skill) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {skill}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="pl-3 pr-1 py-1 gap-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => setSelectedSkills(prev => prev.filter(s => s !== skill))}
                      className="ml-1 rounded-full hover:bg-muted p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => navigate("/student/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSaveProfile} disabled={saving} className="bg-gradient-primary">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            {saving ? "Saving" : "Save profile"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
