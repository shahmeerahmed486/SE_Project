"use client"

import { Standings } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LeagueStandingsProps {
  standings: Standings;
  teamNameMap: Record<string, string>;
}

export default function LeagueStandings({ standings, teamNameMap }: LeagueStandingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>League Standings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Pos</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="w-12 text-center">Played</TableHead>
                <TableHead className="w-12 text-center">W</TableHead>
                <TableHead className="w-12 text-center">D</TableHead>
                <TableHead className="w-12 text-center">L</TableHead>
                <TableHead className="w-12 text-center">GF</TableHead>
                <TableHead className="w-12 text-center">GA</TableHead>
                <TableHead className="w-12 text-center">GD</TableHead>
                <TableHead className="w-12 text-center">Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.rankings
                .sort((a, b) => a.rank - b.rank)
                .map((team) => (
                  <TableRow key={team.teamId} className="group">
                    <TableCell className="font-medium">{team.rank}</TableCell>
                    <TableCell>
                      {teamNameMap[team.teamId] || 'Unknown Team'}
                    </TableCell>
                    <TableCell className="text-center">{team.played}</TableCell>
                    <TableCell className="text-center">{team.won}</TableCell>
                    <TableCell className="text-center">{team.drawn}</TableCell>
                    <TableCell className="text-center">{team.lost}</TableCell>
                    <TableCell className="text-center">{team.goalsFor}</TableCell>
                    <TableCell className="text-center">{team.goalsAgainst}</TableCell>
                    <TableCell className="text-center">
                      {team.goalsFor - team.goalsAgainst > 0 ? `+${team.goalsFor - team.goalsAgainst}` : team.goalsFor - team.goalsAgainst}
                    </TableCell>
                    <TableCell className="text-center font-bold">{team.points}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Pos: Position, W: Won, D: Drawn, L: Lost, GF: Goals For, GA: Goals Against, GD: Goal Difference, Pts: Points</p>
        </div>
      </CardContent>
    </Card>
  );
} 