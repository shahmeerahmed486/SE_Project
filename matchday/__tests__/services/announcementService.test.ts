import { AnnouncementService } from '../../src/services/announcement/AnnouncementService';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    updateDoc: jest.fn(),
    collection: jest.fn(),
    addDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn()
}));

// TC37: Test AnnouncementService functionality
describe('AnnouncementService', () => {
    const mockAnnouncementId = 'announcement1';
    const mockTournamentId = 'tournament1';
    const mockAnnouncement = {
        title: 'Test Announcement',
        message: 'Test Message',
        tournamentId: mockTournamentId,
        createdBy: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // TC38: Test successful announcement creation
    it('creates announcement successfully', async () => {
        const mockDocRef = { id: mockAnnouncementId };
        (addDoc as jest.Mock).mockResolvedValueOnce(mockDocRef);

        const result = await AnnouncementService.createAnnouncement(mockTournamentId, mockAnnouncement);

        expect(addDoc).toHaveBeenCalledWith(
            collection(db, 'announcements'),
            expect.objectContaining({
                ...mockAnnouncement,
                tournamentId: mockTournamentId
            })
        );
        expect(result.id).toBe(mockAnnouncementId);
    });

    // TC39: Test successful announcement update
    it('updates announcement successfully', async () => {
        const mockAnnouncementDoc = {
            exists: () => true
        };

        (getDoc as jest.Mock).mockResolvedValueOnce(mockAnnouncementDoc);

        await AnnouncementService.updateAnnouncement(mockTournamentId, mockAnnouncementId, {
            title: 'Updated Title'
        });

        expect(updateDoc).toHaveBeenCalledWith(
            doc(db, 'announcements', mockAnnouncementId),
            expect.objectContaining({
                title: 'Updated Title',
                updatedAt: expect.any(String)
            })
        );
    });

    // TC40: Test announcement update with invalid announcement
    it('handles invalid announcement error', async () => {
        const mockAnnouncementDoc = {
            exists: () => false
        };

        (getDoc as jest.Mock).mockResolvedValueOnce(mockAnnouncementDoc);

        await expect(AnnouncementService.updateAnnouncement(mockTournamentId, mockAnnouncementId, {
            title: 'Updated Title'
        })).rejects.toThrow('Failed to update announcement');
    });

    // TC41: Test successful announcement retrieval by tournament
    it('gets announcements by tournament successfully', async () => {
        const mockQuerySnapshot = {
            docs: [
                { id: 'announcement1', data: () => ({ ...mockAnnouncement, tournamentId: mockTournamentId }) },
                { id: 'announcement2', data: () => ({ ...mockAnnouncement, title: 'Announcement 2', tournamentId: mockTournamentId }) }
            ]
        };

        (getDocs as jest.Mock).mockResolvedValueOnce(mockQuerySnapshot);

        const result = await AnnouncementService.getAnnouncements(mockTournamentId);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual(expect.objectContaining({
            ...mockAnnouncement,
            tournamentId: mockTournamentId
        }));
    });

    // TC42: Test successful announcement retrieval by ID
    it('gets announcement by ID successfully', async () => {
        const mockAnnouncementDoc = {
            exists: () => true,
            data: () => ({ ...mockAnnouncement, tournamentId: mockTournamentId })
        };

        (getDoc as jest.Mock).mockResolvedValueOnce(mockAnnouncementDoc);

        const result = await AnnouncementService.getAnnouncement(mockTournamentId, mockAnnouncementId);

        expect(result).toEqual(expect.objectContaining({
            ...mockAnnouncement,
            tournamentId: mockTournamentId
        }));
    });

    // TC43: Test announcement retrieval with invalid ID
    it('handles invalid announcement ID', async () => {
        const mockAnnouncementDoc = {
            exists: () => false
        };

        (getDoc as jest.Mock).mockResolvedValueOnce(mockAnnouncementDoc);

        const result = await AnnouncementService.getAnnouncement(mockTournamentId, mockAnnouncementId);

        expect(result).toBeNull();
    });
}); 