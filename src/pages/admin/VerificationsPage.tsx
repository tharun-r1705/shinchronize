import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    ExternalLink,
    Github,
    Shield,
    FileText,
    Award,
    Search,
    Filter,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    Calendar,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { StatCard } from '@/components/data-display/StatCard';

type VerificationType = 'project' | 'certification';
type VerificationStatus = 'pending' | 'approved' | 'rejected';

interface VerificationRequest {
    _id: string;
    type: VerificationType;
    status: VerificationStatus;
    studentId: {
        _id: string;
        name: string;
        email: string;
        avatarUrl?: string;
        college?: string;
    };
    title: string;
    description?: string;
    proof?: string;
    githubLink?: string;
    credentialUrl?: string;
    issuer?: string;
    issueDate?: string;
    tags?: string[];
    submittedAt: string;
    reviewedAt?: string;
    reviewNote?: string;
}

interface VerificationStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}

export default function VerificationsPage() {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<VerificationStatus | 'all'>('pending');
    const [typeFilter, setTypeFilter] = useState<VerificationType | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
    const [reviewNote, setReviewNote] = useState('');
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

    const { data: verifications, isLoading } = useQuery({
        queryKey: ['admin-verifications', activeTab, typeFilter],
        queryFn: async () => {
            const response = await adminApi.getVerifications(
                { status: activeTab !== 'all' ? activeTab : undefined, type: typeFilter !== 'all' ? typeFilter : undefined },
                token!
            );
            return response as VerificationRequest[];
        },
        enabled: !!token,
    });

    const { data: stats } = useQuery({
        queryKey: ['admin-verification-stats'],
        queryFn: async () => {
            const response = await adminApi.getVerificationStats(token!);
            return response as VerificationStats;
        },
        enabled: !!token,
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, note }: { id: string; note?: string }) =>
            adminApi.approveVerification(id, note, token!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
            queryClient.invalidateQueries({ queryKey: ['admin-verification-stats'] });
            toast.success('Verification approved!');
            setSelectedRequest(null);
            setReviewNote('');
        },
        onError: () => toast.error('Failed to approve verification'),
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, note }: { id: string; note: string }) =>
            adminApi.rejectVerification(id, note, token!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
            queryClient.invalidateQueries({ queryKey: ['admin-verification-stats'] });
            toast.success('Verification rejected');
            setSelectedRequest(null);
            setReviewNote('');
        },
        onError: () => toast.error('Failed to reject verification'),
    });

    const filteredVerifications = verifications?.filter(v =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.studentId.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleExpand = (id: string) => {
        setExpandedCards(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
                <div>
                    <h1 className="text-2xl font-bold">Verifications</h1>
                    <p className="text-muted-foreground">
                        Review and verify student projects and certifications
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-verifications'] })}
                    className="gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="grid gap-4 md:grid-cols-4"
            >
                <StatCard
                    title="Total Requests"
                    value={stats?.total || 0}
                    icon={FileText}
                />
                <StatCard
                    title="Pending"
                    value={stats?.pending || 0}
                    icon={Clock}
                    variant="warning"
                />
                <StatCard
                    title="Approved"
                    value={stats?.approved || 0}
                    icon={CheckCircle}
                    variant="success"
                />
                <StatCard
                    title="Rejected"
                    value={stats?.rejected || 0}
                    icon={XCircle}
                    variant="destructive"
                />
            </motion.div>

            {/* Filters */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <Tabs
                            value={activeTab}
                            onValueChange={v => setActiveTab(v as VerificationStatus | 'all')}
                            className="flex-shrink-0"
                        >
                            <TabsList>
                                <TabsTrigger value="pending" className="gap-2">
                                    <Clock className="w-4 h-4" />
                                    Pending
                                    {stats?.pending ? (
                                        <Badge variant="secondary" className="ml-1">
                                            {stats.pending}
                                        </Badge>
                                    ) : null}
                                </TabsTrigger>
                                <TabsTrigger value="approved">Approved</TabsTrigger>
                                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                                <TabsTrigger value="all">All</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex-1 flex gap-2">
                            <div className="relative flex-1 max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by title or student..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={typeFilter} onValueChange={v => setTypeFilter(v as VerificationType | 'all')}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="project">Projects</SelectItem>
                                    <SelectItem value="certification">Certifications</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Verification List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            ) : filteredVerifications?.length === 0 ? (
                <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                        <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No verification requests found</p>
                        <p className="text-sm">
                            {activeTab === 'pending'
                                ? 'All caught up! No pending requests.'
                                : 'Try adjusting your filters.'}
                        </p>
                    </div>
                </Card>
            ) : (
                <AnimatePresence mode="popLayout">
                    <div className="space-y-4">
                        {filteredVerifications?.map((request, index) => (
                            <motion.div
                                key={request._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className={cn(
                                    'transition-all',
                                    request.status === 'pending' && 'border-l-4 border-l-warning'
                                )}>
                                    <CardContent className="p-4">
                                        <div className="flex gap-4">
                                            <Avatar className="w-10 h-10">
                                                <AvatarImage src={request.studentId.avatarUrl} />
                                                <AvatarFallback>
                                                    {request.studentId.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="font-semibold">{request.title}</h3>
                                                            <Badge variant={request.type === 'project' ? 'default' : 'secondary'}>
                                                                {request.type === 'project' ? (
                                                                    <Github className="w-3 h-3 mr-1" />
                                                                ) : (
                                                                    <Award className="w-3 h-3 mr-1" />
                                                                )}
                                                                {request.type}
                                                            </Badge>
                                                            <StatusBadge status={request.status} />
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            by {request.studentId.name}
                                                            {request.studentId.college && ` • ${request.studentId.college}`}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(request.submittedAt).toLocaleDateString()}
                                                        </span>
                                                        {request.status === 'pending' && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => setSelectedRequest(request)}
                                                                className="gap-1"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                Review
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Expandable Details */}
                                                <div className="mt-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleExpand(request._id)}
                                                        className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground"
                                                    >
                                                        {expandedCards.has(request._id) ? (
                                                            <>
                                                                <ChevronUp className="w-4 h-4 mr-1" />
                                                                Less details
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ChevronDown className="w-4 h-4 mr-1" />
                                                                More details
                                                            </>
                                                        )}
                                                    </Button>

                                                    <AnimatePresence>
                                                        {expandedCards.has(request._id) && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                                                                    {request.description && (
                                                                        <p className="text-muted-foreground">
                                                                            {request.description}
                                                                        </p>
                                                                    )}
                                                                    {request.tags && request.tags.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {request.tags.map((tag, i) => (
                                                                                <Badge key={i} variant="outline" className="text-xs">
                                                                                    {tag}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    <div className="flex gap-4">
                                                                        {request.githubLink && (
                                                                            <a
                                                                                href={request.githubLink}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-primary flex items-center gap-1 hover:underline"
                                                                            >
                                                                                <Github className="w-4 h-4" />
                                                                                View Repo
                                                                                <ExternalLink className="w-3 h-3" />
                                                                            </a>
                                                                        )}
                                                                        {request.credentialUrl && (
                                                                            <a
                                                                                href={request.credentialUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-primary flex items-center gap-1 hover:underline"
                                                                            >
                                                                                <Award className="w-4 h-4" />
                                                                                Verify Credential
                                                                                <ExternalLink className="w-3 h-3" />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                    {request.issuer && (
                                                                        <p className="text-muted-foreground">
                                                                            Issuer: {request.issuer}
                                                                        </p>
                                                                    )}
                                                                    {request.reviewNote && (
                                                                        <div className="p-2 rounded bg-muted/50">
                                                                            <p className="text-xs text-muted-foreground font-medium mb-1">
                                                                                Review Note:
                                                                            </p>
                                                                            <p>{request.reviewNote}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </AnimatePresence>
            )}

            {/* Review Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Review Verification</DialogTitle>
                        <DialogDescription>
                            Review and approve or reject this verification request.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={selectedRequest.studentId.avatarUrl} />
                                    <AvatarFallback>
                                        {selectedRequest.studentId.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{selectedRequest.studentId.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedRequest.studentId.email}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant={selectedRequest.type === 'project' ? 'default' : 'secondary'}>
                                        {selectedRequest.type}
                                    </Badge>
                                    <h3 className="font-semibold">{selectedRequest.title}</h3>
                                </div>
                                {selectedRequest.description && (
                                    <p className="text-sm text-muted-foreground">
                                        {selectedRequest.description}
                                    </p>
                                )}
                                {selectedRequest.tags && selectedRequest.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {selectedRequest.tags.map((tag, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                {selectedRequest.githubLink && (
                                    <a
                                        href={selectedRequest.githubLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary text-sm flex items-center gap-1 hover:underline"
                                    >
                                        <Github className="w-4 h-4" />
                                        View Repository
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                                {selectedRequest.credentialUrl && (
                                    <a
                                        href={selectedRequest.credentialUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary text-sm flex items-center gap-1 hover:underline"
                                    >
                                        <Award className="w-4 h-4" />
                                        Verify Credential
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>

                            <Separator />

                            <div>
                                <label className="text-sm font-medium">Review Note (optional)</label>
                                <Textarea
                                    value={reviewNote}
                                    onChange={e => setReviewNote(e.target.value)}
                                    placeholder="Add a note for the student..."
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setSelectedRequest(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (!reviewNote.trim()) {
                                    toast.error('Please provide a reason for rejection');
                                    return;
                                }
                                rejectMutation.mutate({
                                    id: selectedRequest!._id,
                                    note: reviewNote,
                                });
                            }}
                            disabled={rejectMutation.isPending}
                            className="gap-2"
                        >
                            <XCircle className="w-4 h-4" />
                            Reject
                        </Button>
                        <Button
                            onClick={() =>
                                approveMutation.mutate({
                                    id: selectedRequest!._id,
                                    note: reviewNote || undefined,
                                })
                            }
                            disabled={approveMutation.isPending}
                            className="gap-2"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatusBadge({ status }: { status: VerificationStatus }) {
    const config = {
        pending: { icon: Clock, className: 'bg-warning/10 text-warning border-warning/20' },
        approved: { icon: CheckCircle, className: 'bg-success/10 text-success border-success/20' },
        rejected: { icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
    };

    const { icon: Icon, className } = config[status];

    return (
        <Badge variant="outline" className={cn('gap-1', className)}>
            <Icon className="w-3 h-3" />
            {status}
        </Badge>
    );
}
