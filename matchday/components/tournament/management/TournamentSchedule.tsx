"use client"

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/src/firebase/config';
import { Match, Tournament, Standings } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { generateSchedule } from '@/lib/tournament-scheduling';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Trophy, Users, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import MatchCard from './MatchCard';
import LeagueStandings from './LeagueStandings';
import KnockoutBracket from './KnockoutBracket';

interface Team {
  id: string;
  name: string;
}

interface TournamentScheduleProps {
  tournament: Tournament;
  updateTournament: (data: Partial<Tournament>) => void;
}

export default function TournamentSchedule({ tournament, updateTournament }: TournamentScheduleProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standings | null>(null);
  const [loading, setLoading] = useState(true);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>("matches");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch teams
        const teamsQuery = query(
          collection(db, 'teams'),
          where('tournamentId', '==', tournament.id)
        );
        const teamsSnapshot = await getDocs(teamsQuery);
        const teamsData = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Team));
        setTeams(teamsData);
        
        // Fetch matches
        const matchesQuery = query(
          collection(db, 'matches'),
          where('tournamentId', '==', tournament.id)
        );
        const matchesSnapshot = await getDocs(matchesQuery);
        const matchesData = matchesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Match));
        setMatches(matchesData);
        
        // Fetch standings for league format
        if (tournament.format === 'LEAGUE') {
          const standingsQuery = query(
            collection(db, 'standings'),
            where('tournamentId', '==', tournament.id)
          );
          const standingsSnapshot = await getDocs(standingsQuery);
          if (!standingsSnapshot.empty) {
            const standingsDoc = standingsSnapshot.docs[0];
            setStandings({
              id: standingsDoc.id,
              ...standingsDoc.data()
            } as Standings);
          }
        }
      } catch (error) {
        console.error('Error fetching tournament data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load tournament data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tournament.id, tournament.format, toast]);

  const handleGenerateSchedule = async () => {
    setIsGenerating(true);
    try {
      // Check if there are any existing matches
      if (matches.length > 0) {
        setGenerateDialogOpen(false);
        setDeleteConfirmOpen(true);
        return;
      }
      
      await generateNewSchedule();
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate tournament schedule.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      setGenerateDialogOpen(false);
    }
  };

  const handleConfirmDeleteAndGenerate = async () => {
    setIsGenerating(true);
    try {
      await deleteExistingSchedule();
      await generateNewSchedule();
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Error regenerating schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to regenerate tournament schedule.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteExistingSchedule = async () => {
    // Delete all existing matches
    const batch = writeBatch(db);
    
    for (const match of matches) {
      const matchRef = doc(db, 'matches', match.id);
      batch.delete(matchRef);
    }
    
    // Delete standings if they exist
    if (standings) {
      const standingsRef = doc(db, 'standings', standings.id);
      batch.delete(standingsRef);
    }
    
    await batch.commit();
    
    // Update local state
    setMatches([]);
    setStandings(null);
    
    toast({
      title: 'Success',
      description: 'Existing schedule deleted successfully.',
    });
  };

  const generateNewSchedule = async () => {
    if (teams.length < 2) {
      toast({
        title: 'Error',
        description: 'Need at least 2 teams to generate a schedule.',
        variant: 'destructive',
      });
      return;
    }
    
    // Generate schedule based on tournament format
    const { matches: generatedMatches, groups } = generateSchedule(
      tournament,
      teams.map(team => ({ id: team.id, name: team.name }))
    );
    
    if (generatedMatches.length === 0) {
      toast({
        title: 'Error',
        description: 'Failed to generate matches. Please check tournament configuration.',
        variant: 'destructive',
      });
      return;
    }
    
    // Save matches to Firebase
    const batch = writeBatch(db);
    const newMatches: Match[] = [];
    
    for (const match of generatedMatches) {
      const matchRef = doc(collection(db, 'matches'));
      const matchWithId = { ...match, id: matchRef.id };
      batch.set(matchRef, matchWithId);
      newMatches.push(matchWithId);
    }
    
    // Create initial standings for league format
    if (tournament.format === 'LEAGUE') {
      const standingsRef = doc(collection(db, 'standings'));
      
      const initialStandings: Standings = {
        id: standingsRef.id,
        tournamentId: tournament.id,
        rankings: teams.map(team => ({
          teamId: team.id,
          rank: 0,
          points: 0,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
        })),
        updatedAt: new Date().toISOString(),
      };
      
      batch.set(standingsRef, initialStandings);
      setStandings(initialStandings);
    }
    
    await batch.commit();
    
    // Update local state
    setMatches(newMatches);
    
    toast({
      title: 'Success',
      description: 'Tournament schedule generated successfully.',
    });
  };

  const handleMatchUpdate = async (updatedMatch: Match) => {
    try {
      // Update the match in Firebase
      const matchRef = doc(db, 'matches', updatedMatch.id);
      await updateDoc(matchRef, {
        ...updatedMatch,
        updatedAt: new Date().toISOString()
      });
      
      // Update local state
      setMatches(matches.map(match => 
        match.id === updatedMatch.id ? updatedMatch : match
      ));
      
      // If it's a league match and the match is completed, update standings
      if (tournament.format === 'LEAGUE' && updatedMatch.status === 'COMPLETED' && 
          updatedMatch.scoreA !== null && updatedMatch.scoreB !== null) {
        await updateLeagueStandings(updatedMatch);
      }
      
      toast({
        title: 'Success',
        description: 'Match updated successfully.',
      });
    } catch (error) {
      console.error('Error updating match:', error);
      toast({
        title: 'Error',
        description: 'Failed to update match.',
        variant: 'destructive',
      });
    }
  };

  const updateLeagueStandings = async (updatedMatch: Match) => {
    if (!standings) return;
    
    const { teamA, teamB, scoreA, scoreB } = updatedMatch;
    
    // Deep clone the rankings to avoid mutation issues
    const newRankings = JSON.parse(JSON.stringify(standings.rankings));
    
    // Find team indexes in standings
    const teamAIndex = newRankings.findIndex((r: any) => r.teamId === teamA);
    const teamBIndex = newRankings.findIndex((r: any) => r.teamId === teamB);
    
    if (teamAIndex === -1 || teamBIndex === -1 || scoreA === null || scoreB === null) return;
    
    // Update team A stats
    newRankings[teamAIndex].played += 1;
    newRankings[teamAIndex].goalsFor += scoreA;
    newRankings[teamAIndex].goalsAgainst += scoreB;
    
    // Update team B stats
    newRankings[teamBIndex].played += 1;
    newRankings[teamBIndex].goalsFor += scoreB;
    newRankings[teamBIndex].goalsAgainst += scoreA;
    
    // Update wins, losses, draws and points
    if (scoreA > scoreB) {
      // Team A won
      newRankings[teamAIndex].won += 1;
      newRankings[teamAIndex].points += 3;
      newRankings[teamBIndex].lost += 1;
    } else if (scoreB > scoreA) {
      // Team B won
      newRankings[teamBIndex].won += 1;
      newRankings[teamBIndex].points += 3;
      newRankings[teamAIndex].lost += 1;
    } else {
      // Draw
      newRankings[teamAIndex].drawn += 1;
      newRankings[teamAIndex].points += 1;
      newRankings[teamBIndex].drawn += 1;
      newRankings[teamBIndex].points += 1;
    }
    
    // Sort rankings by points (descending), then goal difference, then goals for
    newRankings.sort((a: any, b: any) => {
      const goalDiffA = a.goalsFor - a.goalsAgainst;
      const goalDiffB = b.goalsFor - b.goalsAgainst;
      
      if (b.points !== a.points) return b.points - a.points;
      if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;
      return b.goalsFor - a.goalsFor;
    });
    
    // Update ranks
    newRankings.forEach((team: any, index: number) => {
      team.rank = index + 1;
    });
    
    const updatedStandings = {
      ...standings,
      rankings: newRankings,
      updatedAt: new Date().toISOString()
    };
    
    // Save to Firebase
    const standingsRef = doc(db, 'standings', standings.id);
    await updateDoc(standingsRef, updatedStandings);
    
    // Update local state
    setStandings(updatedStandings);
  };

  const teamNameMap = teams.reduce((acc, team) => {
    acc[team.id] = team.name;
    return acc;
  }, {} as Record<string, string>);

  const canGenerateSchedule = tournament.status === 'REGISTRATION' || 
    tournament.status === 'REGISTRATION_CLOSED' || 
    tournament.status === 'IN_PROGRESS';

  const getScheduleView = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      );
    }

    if (matches.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="flex justify-center mb-4">
              {tournament.format === 'LEAGUE' ? (
                <Trophy className="h-12 w-12 text-muted-foreground" />
              ) : (
                <Users className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-medium mb-2">No Schedule Generated</h3>
            <p className="text-muted-foreground mb-2">
              There is no match schedule for this tournament yet.
            </p>
            <p className="text-sm text-muted-foreground">
              {tournament.format === 'LEAGUE' 
                ? "Generate a round-robin schedule where each team plays against all other teams." 
                : "Generate a knockout bracket where teams advance through elimination rounds."}
            </p>
          </div>

          {canGenerateSchedule && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{teams.length} teams registered</span>
                <span>•</span>
                <CalendarIcon className="h-4 w-4" />
                <span>Starts {format(new Date(tournament.startDate), 'PP')}</span>
              </div>
              <Button 
                onClick={() => setGenerateDialogOpen(true)}
                disabled={teams.length < 2}
              >
                Generate Schedule
              </Button>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-medium">Tournament Schedule</h3>
            <p className="text-sm text-muted-foreground">
              {tournament.format === 'LEAGUE' 
                ? `${matches.length} matches in total` 
                : `${teams.length} teams in the bracket`}
            </p>
          </div>
          {canGenerateSchedule && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setGenerateDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate Schedule
            </Button>
          )}
        </div>
        
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="matches">
              <Calendar className="h-4 w-4 mr-2" />
              Matches
            </TabsTrigger>
            {tournament.format === "LEAGUE" ? (
              <TabsTrigger value="standings">
                <Trophy className="h-4 w-4 mr-2" />
                Standings
              </TabsTrigger>
            ) : (
              <TabsTrigger value="bracket">
                <Users className="h-4 w-4 mr-2" />
                Tournament Bracket
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="matches" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {matches.map(match => (
                <MatchCard 
                  key={match.id}
                  match={match}
                  teamNameMap={teamNameMap}
                  onMatchUpdate={handleMatchUpdate}
                  isManageable={tournament.status === 'IN_PROGRESS'}
                />
              ))}
            </div>
          </TabsContent>
          
          {tournament.format === "LEAGUE" ? (
            <TabsContent value="standings">
              {standings ? (
                <LeagueStandings 
                  standings={standings} 
                  teamNameMap={teamNameMap} 
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No standings available yet.</p>
                </div>
              )}
            </TabsContent>
          ) : (
            <TabsContent value="bracket">
              <KnockoutBracket 
                matches={matches} 
                teamNameMap={teamNameMap} 
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tournament Schedule</CardTitle>
        <CardDescription>Manage the tournament schedule and results</CardDescription>
      </CardHeader>
      <CardContent>
        {getScheduleView()}
      </CardContent>
            
      {/* Generate Schedule Dialog */}
      <Dialog 
        open={generateDialogOpen} 
        onOpenChange={setGenerateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Tournament Schedule</DialogTitle>
            <DialogDescription>
              This will create a match schedule based on registered teams.
              {tournament.format === 'LEAGUE' && " Each team will play against all other teams."}
              {tournament.format === 'KNOCKOUT' && " Teams will be randomly seeded in a knockout bracket."}
              {tournament.format === 'GROUP_KNOCKOUT' && " Teams will be assigned to groups for the group stage."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" />
                <h4 className="font-medium">Registered Teams ({teams.length})</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {teams.map(team => (
                  <div key={team.id} className="px-3 py-2 rounded-md bg-muted">
                    {team.name}
                  </div>
                ))}
              </div>
            </div>
            
            {teams.length < 2 && (
              <div className="bg-amber-50 text-amber-800 p-3 rounded-md text-sm">
                You need at least 2 teams to generate a schedule.
              </div>
            )}

            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>Tournament starts on {format(new Date(tournament.startDate), 'PPP')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                <span>
                  {tournament.format === 'LEAGUE' 
                    ? `${(teams.length * (teams.length - 1)) / 2} matches will be generated` 
                    : `${teams.length - 1} matches will be generated`}
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGenerateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateSchedule}
              disabled={isGenerating || teams.length < 2}
            >
              {isGenerating ? <Spinner size="sm" className="mr-2" /> : null}
              Generate Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <AlertDialog 
        open={deleteConfirmOpen} 
        onOpenChange={setDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Existing Schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This tournament already has a schedule. Generating a new one will delete all existing matches and results.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDeleteAndGenerate}
              className="bg-red-600 hover:bg-red-700"
            >
              {isGenerating ? <Spinner size="sm" className="mr-2" /> : null}
              Delete and Generate New
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
} 