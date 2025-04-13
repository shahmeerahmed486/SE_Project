"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStatus } from "@/src/hooks/useAuthStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Tournament, TournamentStatus } from "@/src/types";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Pencil, Trash2, Megaphone, ChevronDown, Check, X, Calendar, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { use } from "react";

export default function TournamentManagement({ params }: { params: { id: string } }) {
    const { user, loading } = useAuthStatus();
    const router = useRouter();
    const { toast } = useToast();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [newRule, setNewRule] = useState("");
    const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
    const [editingRule, setEditingRule] = useState("");
    const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: "",
        description: ""
    });

    // Unwrap params using React.use()
    const unwrappedParams = use(params);
    const tournamentId = unwrappedParams.id;

    useEffect(() => {
        const fetchTournament = async () => {
            try {
                const tournamentDoc = await getDoc(doc(db, "tournaments", tournamentId));
                if (tournamentDoc.exists()) {
                    const data = tournamentDoc.data();
                    setTournament({
                        id: tournamentDoc.id,
                        ...data,
                        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
                        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
                        registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline).toISOString() : null
                    } as Tournament);
                } else {
                    toast({
                        title: "Error",
                        description: "Tournament not found",
                        variant: "destructive"
                    });
                    router.push("/admin/dashboard");
                }
            } catch (error) {
                console.error("Error fetching tournament:", error);
                toast({
                    title: "Error",
                    description: "Failed to load tournament data",
                    variant: "destructive"
                });
            }
        };

        if (!loading && user?.role === "ADMIN") {
            fetchTournament();
        }
    }, [tournamentId, user, loading, toast, router]);

    const handleAddRule = async () => {
        if (!tournament || !newRule.trim()) return;

        try {
            const tournamentRef = doc(db, "tournaments", tournament.id);
            await updateDoc(tournamentRef, {
                rules: arrayUnion(newRule.trim())
            });

            setTournament(prev => prev ? {
                ...prev,
                rules: [...(prev.rules || []), newRule.trim()]
            } : null);
            setNewRule("");

            toast({
                title: "Success",
                description: "Rule added successfully"
            });
        } catch (error) {
            console.error("Error adding rule:", error);
            toast({
                title: "Error",
                description: "Failed to add rule",
                variant: "destructive"
            });
        }
    };

    const handleEditRule = async (index: number) => {
        if (!tournament || !editingRule.trim()) return;

        try {
            const tournamentRef = doc(db, "tournaments", tournament.id);
            const updatedRules = [...(tournament.rules || [])];
            updatedRules[index] = editingRule.trim();

            await updateDoc(tournamentRef, {
                rules: updatedRules
            });

            setTournament(prev => prev ? {
                ...prev,
                rules: updatedRules
            } : null);
            setEditingRuleIndex(null);
            setEditingRule("");

            toast({
                title: "Success",
                description: "Rule updated successfully"
            });
        } catch (error) {
            console.error("Error updating rule:", error);
            toast({
                title: "Error",
                description: "Failed to update rule",
                variant: "destructive"
            });
        }
    };

    const handleDeleteRule = async (index: number) => {
        if (!tournament) return;

        try {
            const tournamentRef = doc(db, "tournaments", tournament.id);
            const updatedRules = [...(tournament.rules || [])];
            updatedRules.splice(index, 1);

            await updateDoc(tournamentRef, {
                rules: updatedRules
            });

            setTournament(prev => prev ? {
                ...prev,
                rules: updatedRules
            } : null);

            toast({
                title: "Success",
                description: "Rule deleted successfully"
            });
        } catch (error) {
            console.error("Error deleting rule:", error);
            toast({
                title: "Error",
                description: "Failed to delete rule",
                variant: "destructive"
            });
        }
    };

    const handleStatusChange = async (newStatus: TournamentStatus) => {
        if (!tournament) return;

        try {
            const tournamentRef = doc(db, "tournaments", tournament.id);
            await updateDoc(tournamentRef, {
                status: newStatus
            });

            setTournament(prev => prev ? {
                ...prev,
                status: newStatus
            } : null);

            toast({
                title: "Success",
                description: "Tournament status updated successfully"
            });
        } catch (error) {
            console.error("Error updating tournament status:", error);
            toast({
                title: "Error",
                description: "Failed to update tournament status",
                variant: "destructive"
            });
        }
    };

    const handleCreateAnnouncement = async () => {
        if (!tournament || !newAnnouncement.title.trim() || !newAnnouncement.description.trim()) return;

        try {
            const tournamentRef = doc(db, "tournaments", tournament.id);
            await updateDoc(tournamentRef, {
                announcements: arrayUnion({
                    title: newAnnouncement.title.trim(),
                    description: newAnnouncement.description.trim(),
                    createdAt: new Date().toISOString()
                })
            });

            setNewAnnouncement({ title: "", description: "" });
            setShowAnnouncementDialog(false);

            toast({
                title: "Success",
                description: "Announcement created successfully"
            });
        } catch (error) {
            console.error("Error creating announcement:", error);
            toast({
                title: "Error",
                description: "Failed to create announcement",
                variant: "destructive"
            });
        }
    };

    const handleUpdateTournament = async () => {
        if (!tournament) return;

        try {
            const tournamentRef = doc(db, "tournaments", tournament.id);
            await updateDoc(tournamentRef, {
                name: tournament.name,
                description: tournament.description,
                location: tournament.location,
                startDate: tournament.startDate,
                endDate: tournament.endDate,
                registrationDeadline: tournament.registrationDeadline,
                format: tournament.format,
                maxTeams: tournament.maxTeams,
                updatedAt: new Date().toISOString()
            });

            toast({
                title: "Success",
                description: "Tournament updated successfully"
            });
        } catch (error) {
            console.error("Error updating tournament:", error);
            toast({
                title: "Error",
                description: "Failed to update tournament",
                variant: "destructive"
            });
        }
    };

    const getStatusColor = (status: TournamentStatus) => {
        switch (status) {
            case TournamentStatus.DRAFT:
                return "text-yellow-500";
            case TournamentStatus.REGISTRATION_OPEN:
                return "text-green-500";
            case TournamentStatus.REGISTRATION_CLOSED:
                return "text-red-500";
            case TournamentStatus.ONGOING:
                return "text-blue-500";
            case TournamentStatus.COMPLETED:
                return "text-gray-500";
            default:
                return "text-gray-500";
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user || user.role !== "ADMIN") {
        return null;
    }

    if (!tournament) {
        return <div>Tournament not found</div>;
    }

    return (
        <div className="container py-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Tournament</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{tournament.name}</p>
                </div>
                <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
                    Back to Dashboard
                </Button>
            </div>

            <Tabs defaultValue="details" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="rules">Rules</TabsTrigger>
                    <TabsTrigger value="announcements">Announcements</TabsTrigger>
                    <TabsTrigger value="teams">Teams</TabsTrigger>
                    <TabsTrigger value="matches">Matches</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>Tournament Details</CardTitle>
                                    <CardDescription>Manage tournament information and settings</CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">
                                            <span className={getStatusColor(tournament.status)}>
                                                {tournament.status === TournamentStatus.DRAFT && '📝 Draft'}
                                                {tournament.status === TournamentStatus.REGISTRATION_OPEN && '🏆 Registration Open'}
                                                {tournament.status === TournamentStatus.REGISTRATION_CLOSED && '🚫 Registration Closed'}
                                                {tournament.status === TournamentStatus.ONGOING && '⏳ Ongoing'}
                                                {tournament.status === TournamentStatus.COMPLETED && '✅ Completed'}
                                            </span>
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem
                                            onClick={() => handleStatusChange(TournamentStatus.DRAFT)}
                                            disabled={tournament.status === TournamentStatus.DRAFT}
                                        >
                                            📝 Draft
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleStatusChange(TournamentStatus.REGISTRATION_OPEN)}
                                            disabled={tournament.status === TournamentStatus.REGISTRATION_OPEN}
                                        >
                                            🏆 Registration Open
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleStatusChange(TournamentStatus.REGISTRATION_CLOSED)}
                                            disabled={tournament.status === TournamentStatus.REGISTRATION_CLOSED}
                                        >
                                            🚫 Registration Closed
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleStatusChange(TournamentStatus.ONGOING)}
                                            disabled={tournament.status === TournamentStatus.ONGOING}
                                        >
                                            ⏳ Ongoing
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleStatusChange(TournamentStatus.COMPLETED)}
                                            disabled={tournament.status === TournamentStatus.COMPLETED}
                                        >
                                            ✅ Completed
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Tournament Name</Label>
                                        <Input
                                            id="name"
                                            value={tournament.name}
                                            onChange={(e) => setTournament(prev => prev ? { ...prev, name: e.target.value } : null)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="location">Location</Label>
                                        <Input
                                            id="location"
                                            value={tournament.location || ''}
                                            onChange={(e) => setTournament(prev => prev ? { ...prev, location: e.target.value } : null)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={tournament.description || ''}
                                        onChange={(e) => setTournament(prev => prev ? { ...prev, description: e.target.value } : null)}
                                    />
                                </div>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">Start Date</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={tournament.startDate ? format(new Date(tournament.startDate), 'yyyy-MM-dd') : ''}
                                            onChange={(e) => setTournament(prev => prev ? { ...prev, startDate: e.target.value } : null)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">End Date</Label>
                                        <Input
                                            id="endDate"
                                            type="date"
                                            value={tournament.endDate ? format(new Date(tournament.endDate), 'yyyy-MM-dd') : ''}
                                            onChange={(e) => setTournament(prev => prev ? { ...prev, endDate: e.target.value } : null)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                                        <Input
                                            id="registrationDeadline"
                                            type="date"
                                            value={tournament.registrationDeadline ? format(new Date(tournament.registrationDeadline), 'yyyy-MM-dd') : ''}
                                            onChange={(e) => setTournament(prev => prev ? { ...prev, registrationDeadline: e.target.value } : null)}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="format">Tournament Format</Label>
                                        <select
                                            id="format"
                                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                                            value={tournament.format || 'KNOCKOUT'}
                                            onChange={(e) => setTournament(prev => prev ? { ...prev, format: e.target.value } : null)}
                                        >
                                            <option value="KNOCKOUT">Knockout</option>
                                            <option value="LEAGUE">League</option>
                                            <option value="GROUP_KNOCKOUT">Group + Knockout</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxTeams">Maximum Teams</Label>
                                        <Input
                                            id="maxTeams"
                                            type="number"
                                            min="2"
                                            value={tournament.maxTeams || 16}
                                            onChange={(e) => setTournament(prev => prev ? { ...prev, maxTeams: parseInt(e.target.value) } : null)}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={handleUpdateTournament}>
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="rules" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tournament Rules</CardTitle>
                            <CardDescription>Define and manage tournament rules</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter a new rule"
                                        value={newRule}
                                        onChange={(e) => setNewRule(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                                    />
                                    <Button onClick={handleAddRule}>
                                        Add Rule
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {tournament.rules?.map((rule, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                                            {editingRuleIndex === index ? (
                                                <>
                                                    <Input
                                                        value={editingRule}
                                                        onChange={(e) => setEditingRule(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleEditRule(index)}
                                                    />
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleEditRule(index)}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setEditingRuleIndex(null)
                                                            setEditingRule("")
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="flex-1">{rule}</span>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setEditingRuleIndex(index)
                                                            setEditingRule(rule)
                                                        }}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteRule(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="announcements" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Announcements</CardTitle>
                                    <CardDescription>Create and manage tournament announcements</CardDescription>
                                </div>
                                <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="h-4 w-4 mr-2" />
                                            New Announcement
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create Announcement</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="title">Title</Label>
                                                <Input
                                                    id="title"
                                                    value={newAnnouncement.title}
                                                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                                                    placeholder="Enter announcement title"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="description">Description</Label>
                                                <Textarea
                                                    id="description"
                                                    value={newAnnouncement.description}
                                                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, description: e.target.value }))}
                                                    placeholder="Enter announcement description"
                                                />
                                            </div>
                                            <Button onClick={handleCreateAnnouncement} className="w-full">
                                                Create Announcement
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {tournament.announcements?.map((announcement, index) => (
                                    <Card key={index}>
                                        <CardHeader>
                                            <CardTitle>{announcement.title}</CardTitle>
                                            <CardDescription>
                                                {format(new Date(announcement.createdAt), 'MMM dd, yyyy')}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p>{announcement.description}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="teams" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Teams</CardTitle>
                            <CardDescription>Manage tournament teams</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">Registered Teams</p>
                                        <p className="text-sm text-muted-foreground">
                                            {tournament.teamCount || 0} / {tournament.maxTeams} teams
                                        </p>
                                    </div>
                                    <Button onClick={() => router.push(`/admin/tournaments/${tournament.id}/teams`)}>
                                        Manage Teams
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="matches" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Matches</CardTitle>
                            <CardDescription>Manage tournament matches</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <Button onClick={() => router.push(`/admin/tournaments/${tournament.id}/matches`)}>
                                    Manage Matches
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
