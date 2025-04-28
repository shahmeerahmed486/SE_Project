import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MatchScheduleForm } from '@/src/components/MatchScheduleForm';
import { Tournament, TournamentFormat, TournamentStatus } from '@/src/types';

// TC01: Test MatchScheduleForm rendering and basic functionality
describe('MatchScheduleForm', () => {
    const mockTournament: Tournament = {
        id: 't1',
        name: 'Test Tournament',
        description: 'Test Description',
        startDate: '2024-01-01',
        endDate: '2024-01-10',
        location: 'Test Location',
        format: TournamentFormat.LEAGUE,
        status: TournamentStatus.DRAFT,
        teamCount: 0,
        maxTeams: 8,
        rules: [],
        registrationDeadline: '2023-12-31',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // TC02: Test form renders with correct initial values
    it('renders form with correct initial values', () => {
        const mockOnScheduleCreated = jest.fn();
        render(<MatchScheduleForm tournament={mockTournament} onScheduleCreated={mockOnScheduleCreated} />);

        expect(screen.getByText(/create match schedule/i)).toBeInTheDocument();
        expect(screen.getByText(/generate a league format match schedule/i)).toBeInTheDocument();
    });

    // TC03: Test form validation
    it('validates tournament status for schedule creation', async () => {
        const mockOnScheduleCreated = jest.fn();
        render(<MatchScheduleForm tournament={mockTournament} onScheduleCreated={mockOnScheduleCreated} />);

        const createButton = screen.getByRole('button', { name: /create schedule/i });
        expect(createButton).toBeDisabled();
        expect(screen.getByText(/match schedule can only be created when tournament registration is closed/i)).toBeInTheDocument();
    });

    // TC04: Test successful schedule creation
    it('handles successful schedule creation', async () => {
        const mockOnScheduleCreated = jest.fn();
        const tournamentWithValidStatus = {
            ...mockTournament,
            status: TournamentStatus.REGISTRATION_CLOSED
        };

        render(<MatchScheduleForm tournament={tournamentWithValidStatus} onScheduleCreated={mockOnScheduleCreated} />);

        const createButton = screen.getByRole('button', { name: /create schedule/i });
        fireEvent.click(createButton);

        await waitFor(() => {
            expect(mockOnScheduleCreated).toHaveBeenCalled();
        });
    });
}); 