import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, FileText, Award, Code, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast({
            title: "Authentication required",
            description: "Please log in to view the admin panel",
            variant: "destructive",
          });
          navigate('/recruiter/login');
          return;
        }

        const data = await adminApi.getPendingVerifications(token);
        setPendingItems(Array.isArray(data) ? data : []);
      } catch (error: any) {
        toast({
          title: "Error loading verifications",
          description: error.message || "Failed to fetch verification data",
          variant: "destructive",
        });
        // Use mock data if API fails
        setPendingItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerifications();
  }, [navigate, toast]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('recruiterData');
    toast({
      title: "Logged out successfully",
    });
    navigate('/');
  };

  const handleVerify = async (item: any) => {
    try {
      const token = localStorage.getItem('token');
      await adminApi.verifyItem({
        studentId: item.student?._id || item.student,
        itemType: item.itemType,
        itemId: item.itemId,
        status: 'verified'
      }, token!);

      setPendingItems(items =>
        items.map(i =>
          i._id === item._id ? { ...i, status: "verified" } : i
        )
      );

      toast({
        title: "Item verified",
        description: "The submission has been verified successfully",
      });
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Failed to verify item",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (item: any) => {
    try {
      const token = localStorage.getItem('token');
      await adminApi.verifyItem({
        studentId: item.student?._id || item.student,
        itemType: item.itemType,
        itemId: item.itemId,
        status: 'rejected'
      }, token!);

      setPendingItems(items =>
        items.map(i =>
          i._id === item._id ? { ...i, status: "rejected" } : i
        )
      );

      toast({
        title: "Item rejected",
        description: "The submission has been rejected",
      });
    } catch (error: any) {
      toast({
        title: "Rejection failed",
        description: error.message || "Failed to reject item",
        variant: "destructive",
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "certificate":
        return <Award className="w-5 h-5 text-primary" />;
      case "project":
        return <Code className="w-5 h-5 text-secondary" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
      case "verified":
        return <Badge className="bg-primary flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>;
      default:
        return null;
    }
  };

  const pendingCount = pendingItems.filter(item => item.status === "pending").length;
  const verifiedCount = pendingItems.filter(item => item.status === "verified").length;
  const rejectedCount = pendingItems.filter(item => item.status === "rejected").length;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Navigation */}
      <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-accent bg-clip-text text-transparent">
            EvolvEd Admin
          </h1>
          <nav className="flex gap-4 items-center">
            <Button variant="ghost" onClick={() => navigate("/recruiter/dashboard")}>
              Dashboard
            </Button>
            <Button variant="ghost" onClick={() => navigate("/admin")}>
              Validation
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Validation Panel</h1>
          <p className="text-muted-foreground text-lg">
            Review and verify student submissions to maintain trust
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending Review</p>
                  <p className="text-3xl font-bold text-primary">{pendingCount}</p>
                </div>
                <Clock className="w-12 h-12 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Verified Today</p>
                  <p className="text-3xl font-bold text-primary">{verifiedCount}</p>
                </div>
                <CheckCircle2 className="w-12 h-12 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Rejected</p>
                  <p className="text-3xl font-bold text-destructive">{rejectedCount}</p>
                </div>
                <XCircle className="w-12 h-12 text-destructive opacity-20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Validation Queue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Validation Queue</CardTitle>
              <CardDescription>Review submissions for authenticity and accuracy</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList>
                  <TabsTrigger value="all">All ({pendingItems.length})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
                  <TabsTrigger value="certificates">Certificates</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4 mt-6">
                  {pendingItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                    >
                      <Card className={`
                        ${item.status === "verified" ? "bg-primary/5 border-primary/20" : ""}
                        ${item.status === "rejected" ? "bg-destructive/5 border-destructive/20" : ""}
                        transition-all
                      `}>
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                                {getIcon(item.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold mb-1">{item.title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Submitted by {item.student}
                                    </p>
                                  </div>
                                  {getStatusBadge(item.status)}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {item.submittedDate}
                                  </div>
                                  <Badge variant="outline" className="capitalize">
                                    {item.type}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {item.status === "pending" && (
                              <div className="flex gap-2 flex-shrink-0">
                                <Button
                                  variant="outline"
                                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                  onClick={() => handleVerify(item.id)}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Verify
                                </Button>
                                <Button
                                  variant="outline"
                                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={() => handleReject(item.id)}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            )}

                            {item.status === "verified" && (
                              <div className="flex items-center gap-2 text-primary flex-shrink-0">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-medium">Verified</span>
                              </div>
                            )}

                            {item.status === "rejected" && (
                              <div className="flex items-center gap-2 text-destructive flex-shrink-0">
                                <XCircle className="w-5 h-5" />
                                <span className="font-medium">Rejected</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </TabsContent>

                <TabsContent value="pending" className="space-y-4 mt-6">
                  {pendingItems
                    .filter(item => item.status === "pending")
                    .map((item, index) => (
                      <Card key={item.id}>
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                                {getIcon(item.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold mb-1">{item.title}</h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                  Submitted by {item.student}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {item.submittedDate}
                                  </div>
                                  <Badge variant="outline" className="capitalize">
                                    {item.type}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="outline"
                                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                onClick={() => handleVerify(item.id)}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Verify
                              </Button>
                              <Button
                                variant="outline"
                                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleReject(item.id)}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {pendingCount === 0 && (
                    <div className="text-center py-12">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No pending items to review</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="certificates" className="space-y-4 mt-6">
                  {pendingItems
                    .filter(item => item.type === "certificate")
                    .map((item) => (
                      <Card key={item.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            <Award className="w-8 h-8 text-primary" />
                            <div className="flex-1">
                              <h4 className="font-semibold">{item.title}</h4>
                              <p className="text-sm text-muted-foreground">{item.student}</p>
                            </div>
                            {getStatusBadge(item.status)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </TabsContent>

                <TabsContent value="projects" className="space-y-4 mt-6">
                  {pendingItems
                    .filter(item => item.type === "project")
                    .map((item) => (
                      <Card key={item.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            <Code className="w-8 h-8 text-secondary" />
                            <div className="flex-1">
                              <h4 className="font-semibold">{item.title}</h4>
                              <p className="text-sm text-muted-foreground">{item.student}</p>
                            </div>
                            {getStatusBadge(item.status)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;
