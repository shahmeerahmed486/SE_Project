import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography
} from '@mui/material';
import { Team } from '../src/types';

interface TeamStats extends Team {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

interface StandingsTableProps {
  teams: TeamStats[];
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ teams }) => {
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const goalDiffA = a.goalsFor - a.goalsAgainst;
    const goalDiffB = b.goalsFor - b.goalsAgainst;
    if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;
    return b.goalsFor - a.goalsFor;
  });

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Position</TableCell>
            <TableCell>Team</TableCell>
            <TableCell align="right">P</TableCell>
            <TableCell align="right">W</TableCell>
            <TableCell align="right">D</TableCell>
            <TableCell align="right">L</TableCell>
            <TableCell align="right">GF</TableCell>
            <TableCell align="right">GA</TableCell>
            <TableCell align="right">GD</TableCell>
            <TableCell align="right">Pts</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedTeams.map((team, index) => (
            <TableRow
              key={team.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell>{index + 1}</TableCell>
              <TableCell component="th" scope="row">
                {team.name}
              </TableCell>
              <TableCell align="right">{team.played}</TableCell>
              <TableCell align="right">{team.won}</TableCell>
              <TableCell align="right">{team.drawn}</TableCell>
              <TableCell align="right">{team.lost}</TableCell>
              <TableCell align="right">{team.goalsFor}</TableCell>
              <TableCell align="right">{team.goalsAgainst}</TableCell>
              <TableCell align="right">{team.goalsFor - team.goalsAgainst}</TableCell>
              <TableCell align="right">{team.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}; 