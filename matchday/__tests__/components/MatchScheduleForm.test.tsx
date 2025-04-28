import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MatchScheduleForm } from '@/src/components/MatchScheduleForm';
import { Tournament, TournamentFormat, TournamentStatus } from '@/src/types';
import { createMatchSchedule } from '@/src/services/matchService';

jest.mock('@/src/services/matchService');

// Mock console.error
jest.spyOn(console, 'error').mockImplementation(() => { });

describe('MatchScheduleForm', () => {
    const mockTournament: Tournament = {
        id: 't1',
        name: 'Test Tournament',
        description: 'Test Description',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        location: 'Test Location',
        format: TournamentFormat.LEAGUE,
        status: TournamentStatus.REGISTRATION_CLOSED,
        teamCount: 0,
        maxTeams: 8,
        rules: [],
        registrationDeadline: '2023-12-31',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const mockOnScheduleCreated = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders form with correct initial values', () => {
        render(
            <MatchScheduleForm
                tournament={mockTournament}
                onScheduleCreated={mockOnScheduleCreated}
            />
        );

        expect(screen.getByText(/create match schedule/i)).toBeInTheDocument();
        expect(screen.getByText(/generate a league format match schedule/i)).toBeInTheDocument();
    });

    it('validates tournament status for schedule creation', async () => {
        const tournamentWithInvalidStatus = {
            ...mockTournament,
            status: TournamentStatus.DRAFT
        };

        render(
            <MatchScheduleForm
                tournament={tournamentWithInvalidStatus}
                onScheduleCreated={mockOnScheduleCreated}
            />
        );

        const createButton = screen.getByRole('button', { name: /create schedule/i });
        expect(createButton).toBeDisabled();
        expect(screen.getByText(/match schedule can only be created when tournament registration is closed/i)).toBeInTheDocument();
    });

    it('handles successful schedule creation', async () => {
        (createMatchSchedule as jest.Mock).mockResolvedValue(undefined);

        render(
            <MatchScheduleForm
                tournament={mockTournament}
                onScheduleCreated={mockOnScheduleCreated}
            />
        );

        const createButton = screen.getByRole('button', { name: /create schedule/i });
        fireEvent.click(createButton);

        await waitFor(() => {
            expect(createMatchSchedule).toHaveBeenCalledWith(mockTournament.id);
            expect(mockOnScheduleCreated).toHaveBeenCalled();
        });
    });
}); 