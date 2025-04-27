"use client"

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebase/config';
import { Tournament, TournamentFormat, TournamentStatus } from '@/src/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MoreVertical, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Team {
  id: string;
  name: string;
  captainId: string;
  captainName?: string;
  memberCount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ELIMINATED';
  createdAt: string;
}

interface TournamentTeamsProps {
  tournament: Tournament;
  updateTournament: (data: Partial<Tournament>) => void;
}

export default function TournamentTeams({ tournament, updateTournament }: TournamentTeamsProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isEliminateDialogOpen, setIsEliminateDialogOpen] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        const teamsQuery = query(
          collection(db, 'teams'),
          where('tournamentId', '==', tournament.id)
        );
        const teamsSnapshot = await getDocs(teamsQuery);
        
        // Get all the team data
        const teamsData = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Team));
        
        setTeams(teamsData);
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast({
          title: 'Error',
          description: 'Failed to load teams data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [tournament.id, toast]);

  const handleStatusChange = async (teamId: string, newStatus: string) => {
    try {
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, { status: newStatus });
      
      // Update local state
      setTeams(teams.map(team => 
        team.id === teamId ? { ...team, status: newStatus as Team['status'] } : team
      ));
      
      toast({
        title: 'Success',
        description: `Team ${newStatus.toLowerCase()} successfully.`,
      });
    } catch (error) {
      console.error('Error updating team status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update team status.',
        variant: 'destructive',
      });
    }
  };

  const handleEliminateTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsEliminateDialogOpen(true);
  };

  const confirmEliminate = async () => {
    if (!selectedTeam) return;
    
    await handleStatusChange(selectedTeam.id, 'ELIMINATED');
    setIsEliminateDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      case 'ELIMINATED':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Eliminated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isKnockoutFormat = tournament.format === TournamentFormat.KNOCKOUT 
  const isTournamentActive = tournament.status === TournamentStatus.ONGOING

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tournament Teams</CardTitle>
        <CardDescription>Manage teams participating in this tournament</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner size="lg" />
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No teams have registered for this tournament yet.</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Captain</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map(team => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>{team.captainName || team.captainId}</TableCell>
                      <TableCell>{team.memberCount}</TableCell>
                      <TableCell>{getStatusBadge(team.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            {team.status === 'PENDING' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(team.id, 'APPROVED')}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  <span>Approve</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(team.id, 'REJECTED')}
                                  className="text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  <span>Reject</span>
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {team.status === 'APPROVED' && isKnockoutFormat && isTournamentActive && (
                              <DropdownMenuItem onClick={() => handleEliminateTeam(team)}>
                                <AlertCircle className="mr-2 h-4 w-4" />
                                <span>Eliminate</span>
                              </DropdownMenuItem>
                            )}
                            
                            {team.status === 'ELIMINATED' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(team.id, 'APPROVED')}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                <span>Restore</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <AlertDialog 
              open={isEliminateDialogOpen} 
              onOpenChange={setIsEliminateDialogOpen}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminate Team?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to eliminate {selectedTeam?.name}? This will mark them as eliminated from the tournament.
                    {tournament.format === 'KNOCKOUT' && " For knockout tournaments, this is used to track which teams advance to the next round."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmEliminate} className="bg-red-600 hover:bg-red-700">
                    Eliminate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardContent>
    </Card>
  );
} 