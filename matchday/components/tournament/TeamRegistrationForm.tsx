'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { validateEmail, validatePhone } from '@/lib/utils';

interface TeamRegistrationFormProps {
    tournamentId: string;
    maxPlayers: number;
    minPlayers: number;
    onClose: () => void;
    onSubmit: (data: {
        teamName: string;
        players: {
            name: string;
            position: string;
            number: string;
        }[];
    }) => void;
}

export default function TeamRegistrationForm({
    tournamentId,
    maxPlayers,
    minPlayers,
    onClose,
    onSubmit
}: TeamRegistrationFormProps) {
    const [teamName, setTeamName] = useState('');
    const [players, setPlayers] = useState([
        { name: '', position: '', number: '' }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const addPlayer = () => {
        if (players.length < maxPlayers) {
            setPlayers([...players, { name: '', position: '', number: '' }]);
        }
    };

    const removePlayer = (index: number) => {
        if (players.length > minPlayers) {
            setPlayers(players.filter((_, i) => i !== index));
        }
    };

    const updatePlayer = (index: number, field: 'name' | 'position' | 'number', value: string) => {
        const newPlayers = [...players];
        newPlayers[index] = { ...newPlayers[index], [field]: value };
        setPlayers(newPlayers);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!teamName.trim()) {
            alert('Please enter a team name');
            return;
        }

        if (players.length < minPlayers) {
            alert(`Please add at least ${minPlayers} players`);
            return;
        }

        if (players.some(player => !player.name.trim() || !player.position.trim() || !player.number.trim())) {
            alert('Please fill in all player details');
            return;
        }

        setIsSubmitting(true);
        try {
            onSubmit({
                teamName,
                players,
            });
        } catch (error) {
            console.error('Error submitting form:', error);
            setErrors({ submit: 'Failed to submit registration. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Team Registration</h2>
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="teamName">Team Name</Label>
                        <Input
                            id="teamName"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Players</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addPlayer}
                                disabled={players.length >= maxPlayers}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Player
                            </Button>
                        </div>

                        {players.map((player, index) => (
                            <div key={index} className="grid grid-cols-4 gap-4 items-start">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={player.name}
                                        onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Position</Label>
                                    <Input
                                        value={player.position}
                                        onChange={(e) => updatePlayer(index, 'position', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Number</Label>
                                    <Input
                                        value={player.number}
                                        onChange={(e) => updatePlayer(index, 'number', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="pt-8">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removePlayer(index)}
                                        disabled={players.length <= minPlayers}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Register Team'}
                        </Button>
                    </div>

                    {errors.submit && (
                        <p className="text-red-500 text-sm mt-4 text-center">{errors.submit}</p>
                    )}
                </form>
            </div>
        </div>
    );
} 