import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, Settings, Bell, Building2, Save, Upload, X } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { recruiterApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const RecruiterSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [linkedinProfile, setLinkedinProfile] = useState("");
  const [aboutCompany, setAboutCompany] = useState("");

  // Hiring Preferences
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [minReadinessScore, setMinReadinessScore] = useState(50);
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [newRole, setNewRole] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [newLocation, setNewLocation] = useState("");

  // Notification Settings
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [skillAlerts, setSkillAlerts] = useState(false);
  const [scoreThresholdAlerts, setScoreThresholdAlerts] = useState(false);

  // Trending skills and roles
  const trendingSkills = [
    "JavaScript", "Python", "Java", "TypeScript", "React",
    "Node.js", "MongoDB", "SQL", "AWS", "Docker",
    "Kubernetes", "Git", "REST API", "GraphQL", "Machine Learning"
  ];

  const commonRoles = [
    "Frontend Developer", "Backend Developer", "Full Stack Developer",
    "Data Scientist", "DevOps Engineer", "ML Engineer",
    "Mobile Developer", "UI/UX Designer", "Product Manager"
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/recruiter/login');
        return;
      }

      const profile: any = await recruiterApi.getProfile(token);
      
      // Set profile data
      setName(profile.name || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      setCompany(profile.company || "");
      setRole(profile.role || "");
      setCompanyWebsite(profile.companyWebsite || "");
      setLinkedinProfile(profile.linkedinProfile || "");
      setAboutCompany(profile.aboutCompany || "");
      setProfilePicture(profile.profilePicture || null);
      setProfilePicturePreview(profile.profilePicture || null);

      // Set preferences
      if (profile.preferences) {
        setTargetRoles(profile.preferences.roles || []);
        setPreferredSkills(profile.preferences.skills || []);
        setMinReadinessScore(profile.preferences.minScore || 50);
        setPreferredLocations(profile.preferences.locations || []);
      }

      // Set notifications (if available)
      if (profile.notifications) {
        setEmailAlerts(profile.notifications.emailAlerts ?? true);
        setWeeklyDigest(profile.notifications.weeklyDigest ?? true);
        setSkillAlerts(profile.notifications.skillAlerts ?? false);
        setScoreThresholdAlerts(profile.notifications.scoreThresholdAlerts ?? false);
      }

    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message || "Failed to fetch profile data",
        variant: "destructive",
      });
      if (error.message.includes('401') || error.message.includes('token')) {
        navigate('/recruiter/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate before saving
    const errors = validateProfile();
    if (errors.length > 0) {
      toast({
        title: "Profile Incomplete",
        description: `Please fill in the following required fields: ${errors.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const updateData = {
        name,
        phone,
        company,
        role,
        companyWebsite,
        linkedinProfile,
        aboutCompany,
        preferences: {
          roles: targetRoles,
          skills: preferredSkills,
          minScore: minReadinessScore,
          locations: preferredLocations,
        },
        notifications: {
          emailAlerts,
          weeklyDigest,
          skillAlerts,
          scoreThresholdAlerts,
        },
      };

      await recruiterApi.updateProfile(updateData, token!);
      
      // Update localStorage
      const recruiterData = JSON.parse(localStorage.getItem('recruiterData') || '{}');
      localStorage.setItem('recruiterData', JSON.stringify({ ...recruiterData, ...updateData }));

      toast({
        title: "Profile updated successfully",
        description: "Your changes have been saved.",
      });
      setHasChanges(false);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addTargetRole = (role?: string) => {
    const roleToAdd = role || newRole.trim();
    if (roleToAdd && !targetRoles.includes(roleToAdd)) {
      setTargetRoles([...targetRoles, roleToAdd]);
      setNewRole("");
      setHasChanges(true);
    }
  };

  const removeTargetRole = (role: string) => {
    setTargetRoles(targetRoles.filter(r => r !== role));
    setHasChanges(true);
  };

  const addSkill = (skill?: string) => {
    const skillToAdd = skill || newSkill.trim();
    if (skillToAdd && !preferredSkills.includes(skillToAdd)) {
      setPreferredSkills([...preferredSkills, skillToAdd]);
      setNewSkill("");
      setHasChanges(true);
    }
  };

  const removeSkill = (skill: string) => {
    setPreferredSkills(preferredSkills.filter(s => s !== skill));
    setHasChanges(true);
  };

  const addLocation = () => {
    const locationToAdd = newLocation.trim();
    if (locationToAdd && !preferredLocations.includes(locationToAdd)) {
      setPreferredLocations([...preferredLocations, locationToAdd]);
      setNewLocation("");
      setHasChanges(true);
    }
  };

  const removeLocation = (location: string) => {
    setPreferredLocations(preferredLocations.filter(l => l !== location));
    setHasChanges(true);
  };

  const markChanged = () => setHasChanges(true);

  // RequiredLabel component
  const RequiredLabel = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
    <Label htmlFor={htmlFor} className="flex items-center gap-1">
      {children}
      <span className="text-red-500">*</span>
    </Label>
  );

  // Validation function
  const validateProfile = () => {
    const errors: string[] = [];
    
    if (!name.trim()) errors.push('Full Name');
    if (!phone.trim()) errors.push('Phone Number');
    if (!company.trim()) errors.push('Company Name');
    if (!role.trim()) errors.push('Job Title/Role');
    // Profile picture is optional
    if (targetRoles.length === 0) errors.push('At least one Target Role');
    if (preferredSkills.length === 0) errors.push('At least one Preferred Skill');
    
    return errors;
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfilePicturePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    uploadProfilePicture(file);
  };

  const uploadProfilePicture = async (file: File) => {
    setIsUploadingPicture(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/recruiter/login');
        return;
      }

      const result: any = await recruiterApi.uploadProfilePicture(file, token);
      
      setProfilePicture(result.recruiter.profilePicture);
      setProfilePicturePreview(result.recruiter.profilePicture);

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const removeProfilePicture = async () => {
    try {
      setIsUploadingPicture(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/recruiter/login');
        return;
      }

      const result: any = await recruiterApi.updateProfile({ profilePicture: null }, token);
      setProfilePicture(result?.profilePicture || null);
      setProfilePicturePreview(result?.profilePicture || null);
      setHasChanges(false);

      toast({
        title: 'Profile picture removed',
        description: 'Your profile picture has been removed.',
      });
    } catch (error: any) {
      toast({
        title: 'Remove failed',
        description: error.message || 'Failed to remove profile picture',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingPicture(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Navigation */}
      <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/recruiter/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-secondary bg-clip-text text-transparent">
              Settings
            </h1>
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="bg-gradient-secondary"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-secondary" />
                Recruiter Settings
              </CardTitle>
              <CardDescription>
                Manage your profile, hiring preferences, and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="preferences">
                    <Building2 className="w-4 h-4 mr-2" />
                    Hiring Preferences
                  </TabsTrigger>
                  <TabsTrigger value="notifications">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6 mt-6">
                  {/* Profile Picture Upload Section */}
                  <div className="mb-8 pb-6 border-b">
                    <Label className="flex items-center gap-2">
                      <span className="text-base font-semibold">Profile Picture</span>
                      <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mb-4">Upload a professional profile picture (optional)</p>
                    <div className="flex items-center gap-6">
                      {/* Avatar Preview */}
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                          {profilePicturePreview ? (
                            <img src={profilePicturePreview} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white font-bold text-2xl">
                              {name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'RC'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Upload Controls */}
                      <div className="space-y-3 flex-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPicture}
                          className="w-full sm:w-auto"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {isUploadingPicture ? 'Uploading...' : 'Choose Image'}
                        </Button>
                        {profilePicturePreview && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeProfilePicture}
                            disabled={isUploadingPicture}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        )}
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <RequiredLabel htmlFor="name">Full Name</RequiredLabel>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => { setName(e.target.value); markChanged(); }}
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email (Read-only)</Label>
                      <Input
                        id="email"
                        value={email}
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <RequiredLabel htmlFor="phone">Phone Number</RequiredLabel>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); markChanged(); }}
                        placeholder="+1 555-123-4567"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <RequiredLabel htmlFor="company">Company Name</RequiredLabel>
                      <Input
                        id="company"
                        value={company}
                        onChange={(e) => { setCompany(e.target.value); markChanged(); }}
                        placeholder="TechCorp Inc."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <RequiredLabel htmlFor="role">Job Title/Role</RequiredLabel>
                      <Input
                        id="role"
                        value={role}
                        onChange={(e) => { setRole(e.target.value); markChanged(); }}
                        placeholder="Senior Technical Recruiter"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Company Website</Label>
                      <Input
                        id="website"
                        value={companyWebsite}
                        onChange={(e) => { setCompanyWebsite(e.target.value); markChanged(); }}
                        placeholder="https://company.com"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="linkedin">LinkedIn Profile</Label>
                      <Input
                        id="linkedin"
                        value={linkedinProfile}
                        onChange={(e) => { setLinkedinProfile(e.target.value); markChanged(); }}
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="about">About Company</Label>
                      <Textarea
                        id="about"
                        value={aboutCompany}
                        onChange={(e) => { setAboutCompany(e.target.value); markChanged(); }}
                        placeholder="Tell candidates about your company..."
                        rows={4}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Hiring Preferences Tab */}
                <TabsContent value="preferences" className="space-y-6 mt-6">
                  {/* Target Roles */}
                  <div className="space-y-3">
                    <RequiredLabel>Target Roles</RequiredLabel>
                    <p className="text-sm text-muted-foreground">
                      At least one role is required - These roles will be saved as your hiring focus
                    </p>
                    
                    {/* Common Roles */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Quick add (click to add):</p>
                      <div className="flex flex-wrap gap-2">
                        {commonRoles.map((role) => (
                          <Badge
                            key={role}
                            variant={targetRoles.includes(role) ? "default" : "outline"}
                            className="cursor-pointer hover:bg-secondary transition-colors"
                            onClick={() => targetRoles.includes(role) ? removeTargetRole(role) : addTargetRole(role)}
                          >
                            {role} {targetRoles.includes(role) && "✓"}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Custom Role Input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add custom role..."
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addTargetRole()}
                      />
                      <Button onClick={() => addTargetRole()} variant="outline">
                        Add
                      </Button>
                    </div>

                    {/* Selected Roles */}
                    {targetRoles.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                        {targetRoles.map((role) => (
                          <Badge key={role} variant="secondary" className="cursor-pointer" onClick={() => removeTargetRole(role)}>
                            {role} ✕
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Preferred Skills */}
                  <div className="space-y-3">
                    <RequiredLabel>Preferred Skills (Default Filter)</RequiredLabel>
                    <p className="text-sm text-muted-foreground">
                      At least one skill is required - These skills will be auto-applied as filters on your dashboard
                    </p>
                    
                    {/* Trending Skills */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Trending skills (click to add):</p>
                      <div className="flex flex-wrap gap-2">
                        {trendingSkills.map((skill) => (
                          <Badge
                            key={skill}
                            variant={preferredSkills.includes(skill) ? "default" : "outline"}
                            className="cursor-pointer hover:bg-secondary transition-colors"
                            onClick={() => preferredSkills.includes(skill) ? removeSkill(skill) : addSkill(skill)}
                          >
                            {skill} {preferredSkills.includes(skill) && "✓"}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Custom Skill Input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add custom skill..."
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addSkill()}
                      />
                      <Button onClick={() => addSkill()} variant="outline">
                        Add
                      </Button>
                    </div>

                    {/* Selected Skills */}
                    {preferredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                        {preferredSkills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                            {skill} ✕
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Minimum Readiness Score */}
                  <div className="space-y-3">
                    <Label>Minimum Readiness Score (Default Filter)</Label>
                    <p className="text-sm text-muted-foreground">
                      Students below this score will be filtered out by default: {minReadinessScore}
                    </p>
                    <Slider
                      value={[minReadinessScore]}
                      onValueChange={(value) => { setMinReadinessScore(value[0]); markChanged(); }}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                  </div>

                  {/* Preferred Locations */}
                  <div className="space-y-3">
                    <Label>Preferred Locations</Label>
                    <p className="text-sm text-muted-foreground">
                      Add locations you're hiring for
                    </p>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="City, State or Remote"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addLocation()}
                      />
                      <Button onClick={addLocation} variant="outline">
                        Add
                      </Button>
                    </div>

                    {/* Selected Locations */}
                    {preferredLocations.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                        {preferredLocations.map((location) => (
                          <Badge key={location} variant="secondary" className="cursor-pointer" onClick={() => removeLocation(location)}>
                            {location} ✕
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6 mt-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label htmlFor="email-alerts">Email Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive email notifications for important updates
                        </p>
                      </div>
                      <Switch
                        id="email-alerts"
                        checked={emailAlerts}
                        onCheckedChange={(checked) => { setEmailAlerts(checked); markChanged(); }}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label htmlFor="weekly-digest">Weekly Digest</Label>
                        <p className="text-sm text-muted-foreground">
                          Get a weekly summary of top candidates and trends
                        </p>
                      </div>
                      <Switch
                        id="weekly-digest"
                        checked={weeklyDigest}
                        onCheckedChange={(checked) => { setWeeklyDigest(checked); markChanged(); }}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label htmlFor="skill-alerts">Skill Match Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when students with your preferred skills join
                        </p>
                      </div>
                      <Switch
                        id="skill-alerts"
                        checked={skillAlerts}
                        onCheckedChange={(checked) => { setSkillAlerts(checked); markChanged(); }}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label htmlFor="score-alerts">Score Threshold Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when students cross your minimum readiness score
                        </p>
                      </div>
                      <Switch
                        id="score-alerts"
                        checked={scoreThresholdAlerts}
                        onCheckedChange={(checked) => { setScoreThresholdAlerts(checked); markChanged(); }}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default RecruiterSettings;
