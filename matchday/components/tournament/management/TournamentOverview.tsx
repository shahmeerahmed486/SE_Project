"use client"

import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/firebase/config';
import { Tournament, TournamentStatus, TournamentFormat, Match, Team } from '@/src/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TournamentOverviewProps {
  tournament: Tournament;
  updateTournament: (data: Partial<Tournament>) => void;
}

interface MatchManagementProps {
  tournamentId: string;
}

function MatchManagement({ tournamentId }: MatchManagementProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingMatch, setIsAddingMatch] = useState(false);
  const [newMatch, setNewMatch] = useState<Partial<Match>>({
    tournamentId,
    teamA: '',
    teamB: '',
    date: '',
    time: '',
    location: '',
    status: 'SCHEDULED',
    scoreA: null,
    scoreB: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMatches();
    fetchTeams();
  }, [tournamentId]);

  const fetchMatches = async () => {
    try {
      const matchesQuery = query(
        collection(db, 'matches'),
        where('tournamentId', '==', tournamentId)
      );
      const matchesSnapshot = await getDocs(matchesQuery);
      const matchesData = matchesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Match));
      setMatches(matchesData);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast({
        title: 'Error',
        description: 'Failed to load matches',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const teamsQuery = query(
        collection(db, 'teams'),
        where('tournamentId', '==', tournamentId)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      const teamsData = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Team));
      setTeams(teamsData);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleAddMatch = async () => {
    try {
      const matchRef = await addDoc(collection(db, 'matches'), {
        ...newMatch,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      setMatches([...matches, { id: matchRef.id, ...newMatch } as Match]);
      setIsAddingMatch(false);
      setNewMatch({
        tournamentId,
        teamA: '',
        teamB: '',
        date: '',
        time: '',
        location: '',
        status: 'SCHEDULED',
        scoreA: null,
        scoreB: null,
      });
      
      toast({
        title: 'Success',
        description: 'Match added successfully',
      });
    } catch (error) {
      console.error('Error adding match:', error);
      toast({
        title: 'Error',
        description: 'Failed to add match',
        variant: 'destructive',
      });
    }
  };

  const getMatchWinner = (match: Match) => {
    if (match.status !== 'COMPLETED' || match.scoreA === null || match.scoreB === null) {
      return 'TBD';
    }
    if (match.scoreA === match.scoreB) {
      return 'Tie';
    }
    return match.scoreA > match.scoreB 
      ? teams.find(t => t.id === match.teamA)?.name 
      : teams.find(t => t.id === match.teamB)?.name;
  };

  const getWinningTeamId = (match: Match): string | null => {
    if (match.status !== 'COMPLETED' || match.scoreA === null || match.scoreB === null) {
      return null;
    }
    if (match.scoreA === match.scoreB) {
      return null; // No winner in case of a tie
    }
    return match.scoreA > match.scoreB ? match.teamA : match.teamB;
  };

  const updateDependentMatches = async (completedMatch: Match) => {
    const winningTeamId = getWinningTeamId(completedMatch);
    if (!winningTeamId) return; // No winner to propagate

    // Find all matches that have TBD teams
    const tbdMatches = matches.filter(match => 
      match.teamA === 'TBD' || match.teamB === 'TBD'
    );

    // Update each TBD match that depends on this completed match
    for (const tbdMatch of tbdMatches) {
      let updates: Partial<Match> = {};

      // Check if this TBD match should be updated based on the completed match
      if (tbdMatch.teamA === 'TBD') {
        updates.teamA = winningTeamId;
      } else if (tbdMatch.teamB === 'TBD') {
        updates.teamB = winningTeamId;
      }

      if (Object.keys(updates).length > 0) {
        try {
          await handleUpdateMatch(tbdMatch.id, updates);
          toast({
            title: "Match Updated",
            description: "Dependent match has been updated with the winning team.",
          });
        } catch (error) {
          console.error('Error updating dependent match:', error);
          toast({
            title: "Error",
            description: "Failed to update dependent match.",
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleScoreChange = async (matchId: string, team: 'A' | 'B', value: string) => {
    const score = value === '' ? null : parseInt(value);
    const field = team === 'A' ? 'scoreA' : 'scoreB';
    
    try {
      await handleUpdateMatch(matchId, { [field]: score });
      
      // If both scores are now set, check for dependent matches
      const match = matches.find(m => m.id === matchId);
      if (match && match.scoreA !== null && match.scoreB !== null) {
        await updateDependentMatches(match);
      }
    } catch (error) {
      console.error(`Error updating score:`, error);
    }
  };

  const handleUpdateMatch = async (matchId: string, updates: Partial<Match>) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await updateDoc(matchRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      
      // Update local state
      setMatches(matches.map(match => 
        match.id === matchId ? { ...match, ...updates } : match
      ));

      // If this was a score update that completed the match, update dependent matches
      const updatedMatch = { ...matches.find(m => m.id === matchId)!, ...updates };
      if (updates.status === 'COMPLETED' || 
          (updates.scoreA !== undefined && updates.scoreB !== undefined)) {
        await updateDependentMatches(updatedMatch);
      }
      
      toast({
        title: 'Success',
        description: 'Match updated successfully',
      });
    } catch (error) {
      console.error('Error updating match:', error);
      toast({
        title: 'Error',
        description: 'Failed to update match',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    try {
      await deleteDoc(doc(db, 'matches', matchId));
      setMatches(matches.filter(match => match.id !== matchId));
      toast({
        title: 'Success',
        description: 'Match deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting match:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete match',
        variant: 'destructive',
      });
    }
  };

  const handleInlineUpdate = async (matchId: string, field: string, value: string) => {
    try {
      await handleUpdateMatch(matchId, { [field]: value });
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Match Management</CardTitle>
          <Dialog open={isAddingMatch} onOpenChange={setIsAddingMatch}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Match
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Match</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Team A</label>
                    <Select
                      value={newMatch.teamA}
                      onValueChange={(value) => setNewMatch({ ...newMatch, teamA: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Team B</label>
                    <Select
                      value={newMatch.teamB}
                      onValueChange={(value) => setNewMatch({ ...newMatch, teamB: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Input
                      type="date"
                      value={newMatch.date}
                      onChange={(e) => setNewMatch({ ...newMatch, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time</label>
                    <Input
                      type="time"
                      value={newMatch.time}
                      onChange={(e) => setNewMatch({ ...newMatch, time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    value={newMatch.location}
                    onChange={(e) => setNewMatch({ ...newMatch, location: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddMatch} className="w-full">
                  Add Match
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teams</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Winner</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match) => {
              const teamA = teams.find(t => t.id === match.teamA);
              const teamB = teams.find(t => t.id === match.teamB);
              const winner = getMatchWinner(match);
              return (
                <TableRow key={match.id}>
                  <TableCell>
                    {teamA?.name || 'TBD'} vs {teamB?.name || 'TBD'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <span>{format(new Date(match.date), 'MMM dd, yyyy')}</span>
                      <Input
                        type="time"
                        className="w-[120px]"
                        value={match.time}
                        onChange={(e) => handleInlineUpdate(match.id, 'time', e.target.value)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={match.location}
                      onChange={(e) => handleInlineUpdate(match.id, 'location', e.target.value)}
                      className="w-[200px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={match.status}
                      onValueChange={(value) => handleUpdateMatch(match.id, { status: value as 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' })}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Input
                        type="number"
                        className="w-12 text-center"
                        placeholder="__"
                        value={match.scoreA ?? ''}
                        onChange={(e) => handleScoreChange(match.id, 'A', e.target.value)}
                        min={0}
                        disabled={match.status !== 'COMPLETED'}
                      />
                      <span className="font-medium text-muted-foreground">:</span>
                      <Input
                        type="number"
                        className="w-12 text-center"
                        placeholder="__"
                        value={match.scoreB ?? ''}
                        onChange={(e) => handleScoreChange(match.id, 'B', e.target.value)}
                        min={0}
                        disabled={match.status !== 'COMPLETED'}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${
                      winner === 'TBD' ? 'text-muted-foreground' :
                      winner === 'Tie' ? 'text-yellow-600' :
                      'text-primary'
                    }`}>
                      {winner}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteMatch(match.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function TournamentOverview({ tournament, updateTournament }: TournamentOverviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Tournament>>({
    name: tournament.name,
    format: tournament.format,
    startDate: tournament.startDate,
    endDate: tournament.endDate,
    registrationDeadline: tournament.registrationDeadline,
    maxTeams: tournament.maxTeams,
    status: tournament.status,
    rules: tournament.rules || [],
  });

  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseInt(value, 10),
    });
  };

  const handleRulesChange = (index: number, value: string) => {
    const updatedRules = [...(formData.rules || [])];
    updatedRules[index] = value;
    setFormData({
      ...formData,
      rules: updatedRules,
    });
  };

  const addRule = () => {
    setFormData({
      ...formData,
      rules: [...(formData.rules || []), ""],
    });
  };

  const removeRule = (index: number) => {
    const updatedRules = [...(formData.rules || [])];
    updatedRules.splice(index, 1);
    setFormData({
      ...formData,
      rules: updatedRules,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const tournamentRef = doc(db, 'tournaments', tournament.id);
      await updateDoc(tournamentRef, {
        ...formData,
        updatedAt: new Date().toISOString(), // Update timestamp
      });
      updateTournament(formData);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Tournament details updated successfully.",
      });
    } catch (error) {
      console.error("Error updating tournament:", error);
      toast({
        title: "Error",
        description: "Failed to update tournament details.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      // Reset form data to original values if canceling
      setFormData({
        name: tournament.name,
        format: tournament.format,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        registrationDeadline: tournament.registrationDeadline,
        maxTeams: tournament.maxTeams,
        status: tournament.status,
        rules: tournament.rules || [],
      });
    }
    setIsEditing(!isEditing);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return dateString;
    }
  };

  const renderViewMode = () => (
    <>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Format</h3>
            <p className="text-lg">{tournament.format}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Status</h3>
            <p className="text-lg">{tournament.status}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Teams</h3>
            <p className="text-lg">{tournament.teamCount} / {tournament.maxTeams}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Registration Deadline</h3>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(tournament.registrationDeadline)}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Start Date</h3>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(tournament.startDate)}</span>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">End Date</h3>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(tournament.endDate)}</span>
            </div>
          </div>
        </div>

        {tournament.rules && tournament.rules.length > 0 && (
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Tournament Rules</h3>
            <ul className="list-disc pl-5 space-y-1">
              {tournament.rules.map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={toggleEdit}>Edit Details</Button>
      </CardFooter>
      <div className="mt-6">
        <MatchManagement tournamentId={tournament.id} />
      </div>
    </>
  );

  const renderEditMode = () => (
    <>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="name">
            Tournament Name
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="format">
              Format
            </label>
            <Select 
              value={formData.format} 
              onValueChange={(value) => handleSelectChange('format', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TournamentFormat.LEAGUE}>League</SelectItem>
                <SelectItem value={TournamentFormat.KNOCKOUT}>Knockout</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="status">
              Status
            </label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TournamentStatus.DRAFT}>Draft</SelectItem>
                <SelectItem value={TournamentStatus.REGISTRATION_OPEN}>Registration Open</SelectItem>
                <SelectItem value={TournamentStatus.REGISTRATION_CLOSED}>Registration Closed</SelectItem>
                <SelectItem value={TournamentStatus.ONGOING}>Ongoing</SelectItem>
                <SelectItem value={TournamentStatus.COMPLETED}>Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="maxTeams">
              Team Limit
            </label>
            <Input
              id="maxTeams"
              name="maxTeams"
              type="number"
              value={formData.maxTeams}
              onChange={handleNumberChange}
              min={tournament.teamCount}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="registrationDeadline">
              Registration Deadline
            </label>
            <Input
              id="registrationDeadline"
              name="registrationDeadline"
              type="date"
              value={formatDateForInput(formData.registrationDeadline)}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="startDate">
              Start Date
            </label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={formatDateForInput(formData.startDate)}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="endDate">
              End Date
            </label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={formatDateForInput(formData.endDate)}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Tournament Rules</label>
            <Button type="button" variant="outline" onClick={addRule}>
              Add Rule
            </Button>
          </div>
          {(formData.rules || []).map((rule, index) => (
            <div key={index} className="flex items-center gap-2">
              <Textarea
                value={rule}
                onChange={(e) => handleRulesChange(index, e.target.value)}
                placeholder={`Rule ${index + 1}`}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeRule(index)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
        >
          {isSaving ? <Spinner size="sm" className="mr-2" /> : null}
          Save Changes
        </Button>
        <Button variant="outline" onClick={toggleEdit}>
          Cancel
        </Button>
      </CardFooter>
    </>
  );

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch {
      return dateString;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tournament Details</CardTitle>
        <CardDescription>Manage tournament information and settings</CardDescription>
      </CardHeader>
      {isEditing ? renderEditMode() : renderViewMode()}
    </Card>
  );
}