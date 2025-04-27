import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  IconButton,
} from '@ui/material';
import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import { Match } from '../src/types';

interface MatchCardProps {
  match: Match;
  onUpdate?: (matchId: string, homeScore: number, awayScore: number) => void;
  canEdit?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onUpdate,
  canEdit = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() || '');
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() || '');

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(match.id, parseInt(homeScore) || 0, parseInt(awayScore) || 0);
    }
    setIsEditing(false);
  };

  const getWinnerStyle = (isHomeTeam: boolean) => {
    if (!match.homeScore || !match.awayScore) return {};
    const isWinner = isHomeTeam
      ? match.homeScore > match.awayScore
      : match.awayScore > match.homeScore;
    return isWinner ? { fontWeight: 'bold' } : {};
  };

  return (
    <Card
      sx={{
        minWidth: 275,
        backgroundColor: 'background.paper',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {match.datetime ? new Date(match.datetime).toLocaleString() : 'TBD'}
          </Typography>
          {canEdit && (
            <IconButton
              size="small"
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            >
              {isEditing ? <SaveIcon /> : <EditIcon />}
            </IconButton>
          )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography sx={getWinnerStyle(true)}>
            {match.homeTeam?.name || 'TBD'}
          </Typography>
          {isEditing ? (
            <TextField
              size="small"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              type="number"
              sx={{ width: 60 }}
            />
          ) : (
            <Typography>{match.homeScore ?? '-'}</Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={getWinnerStyle(false)}>
            {match.awayTeam?.name || 'TBD'}
          </Typography>
          {isEditing ? (
            <TextField
              size="small"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              type="number"
              sx={{ width: 60 }}
            />
          ) : (
            <Typography>{match.awayScore ?? '-'}</Typography>
          )}
        </Box>
        {match.venue && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {match.venue}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}; 