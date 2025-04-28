import { AnnouncementService } from '@/src/services/announcement/AnnouncementService';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore';

// Mock console.log
jest.spyOn(console, 'log').mockImplementation(() => { });

jest.mock('@/lib/firebase', () => ({
    db: {}
}));

jest.mock('firebase/firestore', () => {
    const actualFirestore = jest.requireActual('firebase/firestore');
    return {
        ...actualFirestore,
        collection: jest.fn(),
        addDoc: jest.fn(),
        getDoc: jest.fn(),
        getDocs: jest.fn(),
        query: jest.fn(),
        where: jest.fn(),
        updateDoc: jest.fn(),
        deleteDoc: jest.fn(),
        doc: jest.fn()
    };
});

describe('AnnouncementService', () => {
    const mockCollectionRef = { path: 'announcements' };
    const tournamentId = 't1';
    const announcementId = 'a1';
    const announcementData = {
        title: 'Test Announcement',
        message: 'Test Message',
        createdBy: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (collection as jest.Mock).mockReturnValue(mockCollectionRef);
    });

    describe('createAnnouncement', () => {
        it('should create an announcement', async () => {
            const mockDocRef = { id: 'generated-id' };
            (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

            const result = await AnnouncementService.createAnnouncement(tournamentId, announcementData);

            expect(collection).toHaveBeenCalledWith(db, 'announcements');
            expect(addDoc).toHaveBeenCalledWith(mockCollectionRef, expect.objectContaining({
                tournamentId,
                title: announcementData.title,
                message: announcementData.message,
                createdBy: announcementData.createdBy,
            }));
            expect(result).toEqual(expect.objectContaining({
                id: 'generated-id',
                tournamentId,
                title: announcementData.title,
                message: announcementData.message,
                createdBy: announcementData.createdBy,
            }));
        });
    });

    describe('getAnnouncements', () => {
        it('should fetch and sort announcements', async () => {
            const mockDocs = [
                {
                    id: 'a1',
                    data: () => ({
                        tournamentId,
                        title: 'First Announcement',
                        message: 'Hello',
                        createdBy: 'user1',
                        createdAt: '2025-04-28T10:00:00.000Z',
                        updatedAt: '2025-04-28T10:00:00.000Z'
                    })
                },
                {
                    id: 'a2',
                    data: () => ({
                        tournamentId,
                        title: 'Second Announcement',
                        message: 'World',
                        createdBy: 'user2',
                        createdAt: '2025-04-29T10:00:00.000Z',
                        updatedAt: '2025-04-29T10:00:00.000Z'
                    })
                }
            ];
            (query as jest.Mock).mockReturnValue('mocked-query');
            (getDocs as jest.Mock).mockResolvedValue({ docs: mockDocs, size: 2 });

            const result = await AnnouncementService.getAnnouncements(tournamentId);

            // Check if collection, query, and getDocs were called
            expect(collection).toHaveBeenCalledWith(db, 'announcements');
            expect(query).toHaveBeenCalled();
            expect(getDocs).toHaveBeenCalled();

            // Ensure announcements are sorted by createdAt (newest first)
            expect(result[0].id).toBe('a2'); // Newest first
            expect(result[1].id).toBe('a1');
        });
    });

    describe('getAnnouncement', () => {
        it('should fetch a single announcement', async () => {
            const mockDocSnap = {
                exists: jest.fn(() => true),
                data: jest.fn(() => ({
                    tournamentId,
                    title: 'Fetched Announcement',
                    message: 'Fetched Message',
                    createdBy: 'user3',
                    createdAt: '2025-04-29T10:00:00.000Z',
                    updatedAt: '2025-04-29T10:00:00.000Z'
                }))
            };
            (doc as jest.Mock).mockReturnValue('mocked-doc-ref');
            (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

            const result = await AnnouncementService.getAnnouncement(tournamentId, announcementId);

            expect(doc).toHaveBeenCalledWith(mockCollectionRef, announcementId);
            expect(getDoc).toHaveBeenCalledWith('mocked-doc-ref');
            expect(result).toEqual(expect.objectContaining({
                tournamentId,
                title: 'Fetched Announcement',
            }));
        });

        it('should return null if announcement does not exist', async () => {
            const mockDocSnap = {
                exists: jest.fn(() => false),
                data: jest.fn()
            };
            (doc as jest.Mock).mockReturnValue('mocked-doc-ref');
            (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

            const result = await AnnouncementService.getAnnouncement(tournamentId, announcementId);

            expect(result).toBeNull();
        });
    });

    describe('updateAnnouncement', () => {
        it('should update an announcement', async () => {
            (doc as jest.Mock).mockReturnValue('mocked-doc-ref');
            (updateDoc as jest.Mock).mockResolvedValue(undefined);

            const updateData = { title: 'Updated Title' };
            await AnnouncementService.updateAnnouncement(tournamentId, announcementId, updateData);

            expect(updateDoc).toHaveBeenCalledWith('mocked-doc-ref', expect.objectContaining({
                title: 'Updated Title',
                updatedAt: expect.any(String)
            }));
        });
    });

    describe('deleteAnnouncement', () => {
        it('should delete an announcement', async () => {
            (doc as jest.Mock).mockReturnValue('mocked-doc-ref');
            (deleteDoc as jest.Mock).mockResolvedValue(undefined);

            await AnnouncementService.deleteAnnouncement(tournamentId, announcementId);

            expect(deleteDoc).toHaveBeenCalledWith('mocked-doc-ref');
        });
    });
});
