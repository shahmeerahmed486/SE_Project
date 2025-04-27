"use client"

import { useState } from 'react';
import { Match } from '@/src/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  teamNameMap: Record<string, string>;
  onMatchUpdate: (updatedMatch: Match) => void;
  isManageable: boolean;
}

export default function MatchCard({ match, teamNameMap, onMatchUpdate, isManageable }: MatchCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedMatch, setEditedMatch] = useState<Match>({ ...match });
  
  const teamAName = teamNameMap[match.teamA] || 'Unknown Team';
  const teamBName = teamNameMap[match.teamB] || 'Unknown Team';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'scoreA' || name === 'scoreB') {
      // Handle score inputs (validate they are numbers)
      const numericValue = value === '' ? null : parseInt(value, 10);
      
      if (value !== '' && (isNaN(numericValue as number) || numericValue as number < 0)) {
        // Invalid input - ignore
        return;
      }
      
      setEditedMatch({
        ...editedMatch,
        [name]: numericValue,
      });
    } else {
      setEditedMatch({
        ...editedMatch,
        [name]: value,
      });
    }
  };

  const handleStatusChange = (status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED') => {
    setEditedMatch({
      ...editedMatch,
      status,
    });
  };

  const handleSaveChanges = () => {
    onMatchUpdate(editedMatch);
    setIsEditDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">Scheduled</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700">In Progress</span>;
      case 'COMPLETED':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700">Completed</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-50 text-gray-700">{status}</span>;
    }
  };

  return (
    <>
      <Card className={match.status === 'COMPLETED' ? 'border-green-200 bg-green-50/20' : ''}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="font-medium">{match.round || 'Match'}</div>
            {getStatusBadge(match.status)}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 text-right">
                <div className="font-medium">{teamAName}</div>
              </div>
              
              <div className="mx-4 flex items-center">
                <div className={`px-2 py-1 rounded w-10 text-center font-medium ${match.status === 'COMPLETED' ? 'bg-white' : 'bg-muted'}`}>
                  {match.scoreA !== null ? match.scoreA : '-'}
                </div>
                <div className="mx-2">vs</div>
                <div className={`px-2 py-1 rounded w-10 text-center font-medium ${match.status === 'COMPLETED' ? 'bg-white' : 'bg-muted'}`}>
                  {match.scoreB !== null ? match.scoreB : '-'}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="font-medium">{teamBName}</div>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{format(new Date(match.date), 'PPP')}</span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>{match.time}</span>
              </div>
              
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{match.location}</span>
              </div>
            </div>
          </div>
        </CardContent>
        
        {isManageable && (
          <CardFooter className="pt-0">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => setIsEditDialogOpen(true)}
            >
              Update Match
            </Button>
          </CardFooter>
        )}
      </Card>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Match Details</DialogTitle>
            <DialogDescription>
              Update the match score and status.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Team A Score</Label>
                <Input
                  type="number"
                  name="scoreA"
                  value={editedMatch.scoreA === null ? '' : editedMatch.scoreA}
                  onChange={handleInputChange}
                  min={0}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Team B Score</Label>
                <Input
                  type="number"
                  name="scoreB"
                  value={editedMatch.scoreB === null ? '' : editedMatch.scoreB}
                  onChange={handleInputChange}
                  min={0}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Match Status</Label>
              <Select
                value={editedMatch.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveChanges}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 