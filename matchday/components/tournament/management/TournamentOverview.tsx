"use client"

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebase/config';
import { Tournament } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TournamentOverviewProps {
  tournament: Tournament;
  updateTournament: (data: Partial<Tournament>) => void;
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
    teamLimit: tournament.teamLimit,
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const tournamentRef = doc(db, 'tournaments', tournament.id);
      await updateDoc(tournamentRef, formData);
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
        teamLimit: tournament.teamLimit,
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
            <p className="text-lg">{tournament.teamCount} / {tournament.teamLimit}</p>
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

        <div>
          <h3 className="font-medium text-sm text-muted-foreground mb-2">Tournament Management Team</h3>
          <div className="flex flex-wrap gap-2 mt-1">
            {tournament.managementTeam && tournament.managementTeam.map((userId, index) => (
              <div key={index} className="px-2 py-1 bg-muted rounded-md text-sm">
                {userId} {/* Ideally would show user name instead of ID */}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={toggleEdit}>Edit Details</Button>
      </CardFooter>
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
                <SelectItem value="LEAGUE">League</SelectItem>
                <SelectItem value="KNOCKOUT">Knockout</SelectItem>
                <SelectItem value="GROUP_KNOCKOUT">Group & Knockout</SelectItem>
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
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="REGISTRATION">Registration</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="teamLimit">
              Team Limit
            </label>
            <Input
              id="teamLimit"
              name="teamLimit"
              type="number"
              value={formData.teamLimit}
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
              value={formData.registrationDeadline?.split('T')[0]}
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
              value={formData.startDate?.split('T')[0]}
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
              value={formData.endDate?.split('T')[0]}
              onChange={handleChange}
            />
          </div>
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