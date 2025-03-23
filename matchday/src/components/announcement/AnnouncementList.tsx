import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Announcement } from '@/src/types';
import { AnnouncementDialog } from './AnnouncementDialog';
import { AnnouncementService } from '@/src/services/announcement/AnnouncementService';
import { format } from 'date-fns';
import { Pencil, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface AnnouncementListProps {
    tournamentId: string;
    isAdmin: boolean;
    currentUserId: string;
}

export function AnnouncementList({ tournamentId, isAdmin, currentUserId }: AnnouncementListProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | undefined>();
    const [expandedAnnouncements, setExpandedAnnouncements] = useState<Set<string>>(new Set());
    const { toast } = useToast();

    useEffect(() => {
        loadAnnouncements();
    }, [tournamentId]);

    const loadAnnouncements = async () => {
        try {
            console.log('Loading announcements for tournament:', tournamentId);
            const data = await AnnouncementService.getAnnouncements(tournamentId);
            console.log('Loaded announcements:', data);
            setAnnouncements(data);
        } catch (error) {
            console.error('Error loading announcements:', error);
            toast({
                title: 'Error',
                description: 'Failed to load announcements',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleAnnouncement = (announcementId: string) => {
        setExpandedAnnouncements(prev => {
            const newSet = new Set(prev);
            if (newSet.has(announcementId)) {
                newSet.delete(announcementId);
            } else {
                newSet.add(announcementId);
            }
            return newSet;
        });
    };

    const handleCreate = async (data: { title: string; description: string }) => {
        try {
            const announcement: Omit<Announcement, 'id'> = {
                tournamentId,
                title: data.title,
                content: data.description,
                description: data.description,
                priority: 'low',
                timestamp: new Date().toISOString(),
                createdBy: currentUserId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await AnnouncementService.createAnnouncement(tournamentId, announcement);
            await loadAnnouncements();
            setShowDialog(false);
            toast({
                title: 'Success',
                description: 'Announcement created successfully',
            });
        } catch (error) {
            console.error('Error creating announcement:', error);
            toast({
                title: 'Error',
                description: 'Failed to create announcement',
                variant: 'destructive',
            });
        }
    };

    const handleEdit = async (data: { title: string; description: string }) => {
        if (!editingAnnouncement) return;

        try {
            const updatedAnnouncement: Partial<Announcement> = {
                title: data.title,
                content: data.description,
                description: data.description,
                updatedAt: new Date().toISOString()
            };
            await AnnouncementService.updateAnnouncement(tournamentId, editingAnnouncement.id, updatedAnnouncement);
            await loadAnnouncements();
            setShowDialog(false);
            setEditingAnnouncement(undefined);
            toast({
                title: 'Success',
                description: 'Announcement updated successfully',
            });
        } catch (error) {
            console.error('Error updating announcement:', error);
            toast({
                title: 'Error',
                description: 'Failed to update announcement',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (announcementId: string) => {
        try {
            await AnnouncementService.deleteAnnouncement(tournamentId, announcementId);
            await loadAnnouncements();
            toast({
                title: 'Success',
                description: 'Announcement deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting announcement:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete announcement',
                variant: 'destructive',
            });
        }
    };

    if (loading) {
        return <div className="text-center py-4">Loading announcements...</div>;
    }

    return (
        <div className="space-y-4">
            {isAdmin && (
                <Button
                    onClick={() => {
                        setEditingAnnouncement(undefined);
                        setShowDialog(true);
                    }}
                    className="w-full"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Announcement
                </Button>
            )}

            {announcements.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                    No announcements yet
                </div>
            ) : (
                <div className="space-y-4">
                    {announcements.map((announcement) => (
                        <Card key={announcement.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                            <CardContent
                                className="p-4"
                                onClick={() => toggleAnnouncement(announcement.id)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{announcement.title}</h3>
                                            <Badge variant={announcement.priority === 'high' ? 'destructive' : announcement.priority === 'medium' ? 'default' : 'secondary'}>
                                                {announcement.priority}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {announcement.content}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(announcement.timestamp), 'MMM dd, yyyy HH:mm')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {expandedAnnouncements.has(announcement.id) ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                        {isAdmin && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingAnnouncement(announcement);
                                                        setShowDialog(true);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(announcement.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {expandedAnnouncements.has(announcement.id) && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {announcement.description}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <AnnouncementDialog
                open={showDialog}
                onOpenChange={setShowDialog}
                onSubmit={editingAnnouncement ? handleEdit : handleCreate}
                mode={editingAnnouncement ? 'edit' : 'create'}
                announcement={editingAnnouncement}
            />
        </div>
    );
} 