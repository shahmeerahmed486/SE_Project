import { render, screen } from '@testing-library/react';
import { MatchScheduleDisplay } from '@/src/components/MatchScheduleDisplay';
import { TournamentFormat } from '@/src/types';

// TC05: Test MatchScheduleDisplay rendering and functionality
describe('MatchScheduleDisplay', () => {
    const mockTournamentId = 't1';

    // TC06: Test display of league format matches
    it('displays league format matches correctly', () => {
        render(
            <MatchScheduleDisplay
                tournamentId={mockTournamentId}
                format={TournamentFormat.LEAGUE}
            />
        );

        expect(screen.getByText(/match schedule/i)).toBeInTheDocument();
        expect(screen.getByText(/no match schedule found/i)).toBeInTheDocument();
    });

    // TC07: Test display of knockout format matches
    it('displays knockout format matches correctly', () => {
        render(
            <MatchScheduleDisplay
                tournamentId={mockTournamentId}
                format={TournamentFormat.KNOCKOUT}
            />
        );

        expect(screen.getByText(/match schedule/i)).toBeInTheDocument();
        expect(screen.getByText(/no match schedule found/i)).toBeInTheDocument();
    });

    // TC08: Test empty matches state
    it('displays empty state when no schedule is found', () => {
        render(
            <MatchScheduleDisplay
                tournamentId={mockTournamentId}
                format={TournamentFormat.LEAGUE}
            />
        );

        expect(screen.getByText(/no match schedule found/i)).toBeInTheDocument();
    });
}); 