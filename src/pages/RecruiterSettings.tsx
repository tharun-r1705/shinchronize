import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, Settings, Save, Upload, X } from "lucide-react";
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


  const markChanged = () => setHasChanges(true);

  // Label component (no required indicator)
  const RequiredLabel = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
    <Label htmlFor={htmlFor} className="flex items-center gap-1">
      {children}
    </Label>
  );

  // Validation function (profile is optional)
  const validateProfile = () => {
    return [] as string[];
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
            className="bg-gradient-secondary text-white shadow-md hover:opacity-95 disabled:opacity-60 disabled:text-white/80"
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
                Manage your profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="profile">
                    <User className="w-4 h-4 mr-2" />
                    Profile
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
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => { setName(e.target.value); markChanged(); }}
                        placeholder="John Doe"
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
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); markChanged(); }}
                        placeholder="+1 555-123-4567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        value={company}
                        onChange={(e) => { setCompany(e.target.value); markChanged(); }}
                        placeholder="TechCorp Inc."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Job Title/Role</Label>
                      <Input
                        id="role"
                        value={role}
                        onChange={(e) => { setRole(e.target.value); markChanged(); }}
                        placeholder="Senior Technical Recruiter"
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

              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default RecruiterSettings;
