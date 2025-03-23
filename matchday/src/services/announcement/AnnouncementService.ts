import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    deleteDoc,
    serverTimestamp,
    addDoc,
    updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Announcement } from '@/src/types';

export class AnnouncementService {
    private static getCollectionRef() {
        return collection(db, 'announcements');
    }

    static async createAnnouncement(tournamentId: string, data: Omit<Announcement, 'id'>): Promise<Announcement> {
        try {
            const announcement: Omit<Announcement, 'id'> = {
                tournamentId,
                title: data.title.trim(),
                description: data.description.trim(),
                content: data.description.trim(),
                priority: 'low',
                timestamp: new Date().toISOString(),
                createdBy: data.createdBy,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            const docRef = await addDoc(this.getCollectionRef(), announcement);
            return { id: docRef.id, ...announcement };
        } catch (error) {
            console.error('Error creating announcement:', error);
            throw new Error('Failed to create announcement');
        }
    }

    static async getAnnouncements(tournamentId: string): Promise<Announcement[]> {
        try {
            console.log('Getting announcements for tournament:', tournamentId);
            const collectionRef = this.getCollectionRef();
            console.log('Collection reference:', collectionRef.path);

            // First get all announcements for the tournament
            const q = query(
                collectionRef,
                where('tournamentId', '==', tournamentId)
            );
            const querySnapshot = await getDocs(q);
            console.log('Query snapshot size:', querySnapshot.size);

            // Then sort them in memory
            const announcements = querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Announcement[];

            // Sort by timestamp in descending order
            announcements.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            console.log('Mapped announcements:', announcements);
            return announcements;
        } catch (error) {
            console.error('Error fetching announcements:', error);
            throw new Error('Failed to fetch announcements');
        }
    }

    static async getAnnouncement(tournamentId: string, announcementId: string): Promise<Announcement | null> {
        try {
            const docRef = doc(this.getCollectionRef(), announcementId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? docSnap.data() as Announcement : null;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    static async updateAnnouncement(tournamentId: string, announcementId: string, data: Partial<Announcement>): Promise<void> {
        try {
            const docRef = doc(this.getCollectionRef(), announcementId);
            const updatedData = {
                ...data,
                updatedAt: new Date().toISOString()
            };
            await updateDoc(docRef, updatedData);
        } catch (error) {
            console.error('Error updating announcement:', error);
            throw new Error('Failed to update announcement');
        }
    }

    static async deleteAnnouncement(tournamentId: string, announcementId: string): Promise<void> {
        try {
            const docRef = doc(this.getCollectionRef(), announcementId);
            await deleteDoc(docRef);
        } catch (error) {
            console.error('Error deleting announcement:', error);
            throw new Error('Failed to delete announcement');
        }
    }
} 