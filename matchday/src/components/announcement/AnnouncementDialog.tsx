import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Announcement } from '@/src/types';

interface AnnouncementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: { title: string; description: string }) => Promise<void>;
    mode: 'create' | 'edit';
    announcement?: Announcement;
}

export function AnnouncementDialog({
    open,
    onOpenChange,
    onSubmit,
    mode,
    announcement
}: AnnouncementDialogProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (mode === 'edit' && announcement) {
            setTitle(announcement.title);
            setDescription(announcement.description);
        } else {
            setTitle('');
            setDescription('');
        }
    }, [mode, announcement]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({ title, description });
            onOpenChange(false);
        } catch (error) {
            console.error('Error submitting announcement:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Create Announcement' : 'Edit Announcement'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="title" className="text-sm font-medium">
                            Title
                        </label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter announcement title"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium">
                            Description
                        </label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter announcement description"
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Submitting...' : mode === 'create' ? 'Create' : 'Update'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
} 