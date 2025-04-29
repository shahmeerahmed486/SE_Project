import { updateMatchResult } from '../services/matchService';

const handleMatchResultUpdate = async (matchId: string, scheduleId: string, scoreA: number, scoreB: number) => {
    try {
        // Validate inputs
        if (typeof scoreA !== 'number' || typeof scoreB !== 'number' || isNaN(scoreA) || isNaN(scoreB)) {
            throw new Error('Invalid scores provided');
        }

        // Update match result
        await updateMatchResult(matchId, scheduleId, scoreA, scoreB);

        // Update local state
        setMatches(prevMatches =>
            prevMatches.map(match =>
                match.id === matchId
                    ? {
                        ...match,
                        scoreA,
                        scoreB,
                        status: 'COMPLETED',
                        updatedAt: new Date().toISOString()
                    }
                    : match
            )
        );

        // Show success message
        toast.success('Match result updated successfully');
    } catch (error) {
        console.error('Error updating match result:', error);
        toast.error(error.message || 'Failed to update match result');
    }
}; 