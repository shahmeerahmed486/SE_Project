"use client"

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/src/firebase/config';
import { Tournament, Announcement } from '@/src/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, PencilIcon, MessageSquare } from 'lucide-react';

interface TournamentAnnouncementsProps {
  tournament: Tournament;
}

export default function TournamentAnnouncements({ tournament }: TournamentAnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        const announcementsQuery = query(
          collection(db, 'announcements'),
          where('tournamentId', '==', tournament.id),
          orderBy('createdAt', 'desc')
        );
        const announcementsSnapshot = await getDocs(announcementsQuery);
        
        const announcementsData = announcementsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Announcement));
        
        setAnnouncements(announcementsData);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        toast({
          title: 'Error',
          description: 'Failed to load announcements.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [tournament.id, toast]);

  const handleCreateAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide both title and message for the announcement.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const newAnnouncement = {
        title,
        message,
        tournamentId: tournament.id,
        createdBy: 'current-user-id', // Replace with actual user ID from auth system
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      const announcementRef = await addDoc(collection(db, 'announcements'), newAnnouncement);
      
      setAnnouncements([
        {
          id: announcementRef.id,
          ...newAnnouncement
        },
        ...announcements
      ]);
      
      setTitle('');
      setMessage('');
      setIsCreatingNew(false);
      
      toast({
        title: 'Success',
        description: 'Announcement created successfully.',
      });
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to create announcement.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSelectedAnnouncementId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAnnouncementId) return;
    
    try {
      await deleteDoc(doc(db, 'announcements', selectedAnnouncementId));
      
      setAnnouncements(announcements.filter(a => a.id !== selectedAnnouncementId));
      
      toast({
        title: 'Success',
        description: 'Announcement deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete announcement.',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirmOpen(false);
      setSelectedAnnouncementId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPp');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tournament Announcements</CardTitle>
          <CardDescription>Manage and create announcements for teams</CardDescription>
        </div>
        <Button
          onClick={() => setIsCreatingNew(true)}
          disabled={isCreatingNew}
        >
          New Announcement
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isCreatingNew && (
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Create New Announcement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="title">
                  Title
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter announcement title"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="message">
                  Message
                </label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter announcement message"
                  rows={4}
                />
              </div>
            </CardContent>
            <CardContent className="flex justify-end gap-2 pt-0">
              <Button variant="outline" onClick={() => setIsCreatingNew(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateAnnouncement}
                disabled={isSubmitting}
              >
                {isSubmitting && <Spinner size="sm" className="mr-2" />}
                Create Announcement
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner size="lg" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
            <h3 className="mt-2 text-lg font-medium">No Announcements</h3>
            <p className="text-muted-foreground">
              There are no announcements for this tournament yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="relative overflow-hidden">
                <div className="absolute top-3 right-3 flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteClick(announcement.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{announcement.title}</CardTitle>
                  <CardDescription>
                    {formatDate(announcement.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{announcement.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
} 