import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Match } from '../types';
import { MatchCard } from './MatchCard';

interface TournamentBracketProps {
  matches: Match[];
  rounds: string[];
  onUpdateMatch?: (matchId: string, homeScore: number, awayScore: number) => void;
  canEdit?: boolean;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
  matches,
  rounds,
  onUpdateMatch,
  canEdit = false,
}) => {
  // Group matches by round
  const matchesByRound = rounds.map((round, index) => ({
    name: round,
    matches: matches.filter(match => match.round === index + 1),
  }));

  return (
    <Box
      sx={{
        overflowX: 'auto',
        width: '100%',
        pb: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 4,
          p: 2,
          minWidth: 'fit-content',
        }}
      >
        {matchesByRound.map((round, roundIndex) => (
          <Box
            key={round.name}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: roundIndex === 0 ? 2 : roundIndex * 4,
              minWidth: 300,
              position: 'relative',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              {round.name}
            </Typography>
            {round.matches.map((match, matchIndex) => (
              <Box
                key={match.id}
                sx={{
                  position: 'relative',
                  '&::after': roundIndex < rounds.length - 1 ? {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    right: '-32px',
                    width: '32px',
                    height: '2px',
                    backgroundColor: 'divider',
                  } : {},
                  '&::before': roundIndex > 0 && matchIndex % 2 === 0 ? {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '-32px',
                    width: '2px',
                    height: `${roundIndex * 100}%`,
                    backgroundColor: 'divider',
                  } : {},
                }}
              >
                <MatchCard
                  match={match}
                  onUpdate={onUpdateMatch}
                  canEdit={canEdit}
                />
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}; 