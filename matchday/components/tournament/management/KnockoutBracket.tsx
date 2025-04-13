"use client"

import { useMemo } from 'react';
import { Match } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KnockoutBracketProps {
  matches: Match[];
  teamNameMap: Record<string, string>;
}

interface BracketRound {
  name: string;
  matches: Match[];
}

export default function KnockoutBracket({ matches, teamNameMap }: KnockoutBracketProps) {
  // Organize matches by round
  const rounds = useMemo(() => {
    const roundGroups = matches.reduce((acc, match) => {
      const roundName = match.round || 'Unknown';
      
      if (!acc[roundName]) {
        acc[roundName] = [];
      }
      
      acc[roundName].push(match);
      return acc;
    }, {} as Record<string, Match[]>);
    
    // Sort rounds and define display order
    const roundOrder: Record<string, number> = {
      'Final': 10000,
      'Semi-final': 9000,
      'Quarter-final': 8000,
      'Round of 16': 7000,
      'Round of 32': 6000,
      'Round of 64': 5000,
    };
    
    // Convert rounds to array and sort them 
    return Object.entries(roundGroups)
      .map(([name, matches]) => ({ name, matches }))
      .sort((a, b) => {
        // Get round numbers if they follow the pattern "R1", "R2", etc.
        const roundAMatch = a.name.match(/R(\d+)/);
        const roundBMatch = b.name.match(/R(\d+)/);
        
        if (roundAMatch && roundBMatch) {
          // Sort in descending order for the bracket (finals should be first)
          return parseInt(roundBMatch[1]) - parseInt(roundAMatch[1]);
        }
        
        // Use predefined order for named rounds
        const orderA = roundOrder[a.name] || 0;
        const orderB = roundOrder[b.name] || 0;
        
        if (orderA !== orderB) {
          return orderB - orderA;
        }
        
        // Fallback to alphabetical sort
        return a.name.localeCompare(b.name);
      });
  }, [matches]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tournament Bracket</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="flex flex-nowrap gap-4 min-w-[800px] p-4">
            {rounds.map((round, roundIndex) => (
              <div key={round.name} className="flex-1 min-w-[180px]">
                <div className="mb-4 text-center font-medium">
                  {round.name}
                </div>
                
                <div className="space-y-8">
                  {round.matches.map((match, matchIndex) => (
                    <div 
                      key={match.id} 
                      className="relative"
                      style={{
                        marginTop: roundIndex > 0 && matchIndex === 0 ? 
                          `${Math.pow(2, roundIndex) * 24}px` : '0px',
                        marginBottom: roundIndex > 0 && matchIndex === round.matches.length - 1 ? 
                          `${Math.pow(2, roundIndex) * 24}px` : '0px',
                      }}
                    >
                      <div className="border rounded-md p-3 bg-card">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`truncate flex-1 ${match.status === 'COMPLETED' && match.scoreA !== null && match.scoreB !== null && match.scoreA > match.scoreB ? 'font-bold' : ''}`}>
                              {teamNameMap[match.teamA] || 'TBD'}
                            </span>
                            <span className="text-sm">
                              {match.scoreA !== null ? match.scoreA : '-'}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between gap-2">
                            <span className={`truncate flex-1 ${match.status === 'COMPLETED' && match.scoreA !== null && match.scoreB !== null && match.scoreB > match.scoreA ? 'font-bold' : ''}`}>
                              {teamNameMap[match.teamB] || 'TBD'}
                            </span>
                            <span className="text-sm">
                              {match.scoreB !== null ? match.scoreB : '-'}
                            </span>
                          </div>
                        </div>
                        
                        {match.date && (
                          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                            {new Date(match.date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      {/* Add connecting lines between rounds */}
                      {roundIndex < rounds.length - 1 && (
                        <div 
                          className="absolute top-1/2 right-0 w-4 h-0.5 bg-border"
                          style={{
                            transform: 'translateY(-50%)',
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {rounds.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No bracket data available. The tournament bracket will be displayed once matches are scheduled.
          </div>
        )}
      </CardContent>
    </Card>
  );
} 