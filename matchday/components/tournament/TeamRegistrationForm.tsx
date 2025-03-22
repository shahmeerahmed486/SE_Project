'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { validateEmail, validatePhone } from '@/lib/utils';

interface TeamRegistrationFormProps {
    tournamentId: string;
    maxPlayers: number;
    minPlayers: number;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
}

interface Player {
    name: string;
    position: string;
    number: string;
}

interface FormData {
    teamName: string;
    teamLogo: File | null;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    players: Player[];
}

export default function TeamRegistrationForm({
    tournamentId,
    maxPlayers = 20,
    minPlayers = 11,
    onClose,
    onSubmit
}: TeamRegistrationFormProps) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        teamName: '',
        teamLogo: null,
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        players: Array(minPlayers).fill('').map(() => ({
            name: '',
            position: '',
            number: ''
        }))
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateStep1 = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.teamName.trim()) {
            newErrors.teamName = 'Team name is required';
        }

        if (!formData.contactName.trim()) {
            newErrors.contactName = 'Contact name is required';
        }

        if (!formData.contactEmail.trim()) {
            newErrors.contactEmail = 'Email is required';
        } else if (!validateEmail(formData.contactEmail)) {
            newErrors.contactEmail = 'Invalid email format';
        }

        if (!formData.contactPhone.trim()) {
            newErrors.contactPhone = 'Phone number is required';
        } else if (!validatePhone(formData.contactPhone)) {
            newErrors.contactPhone = 'Invalid phone number format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors: Record<string, string> = {};
        const filledPlayers = formData.players.filter(p => p.name.trim());

        if (filledPlayers.length < minPlayers) {
            newErrors.players = `Minimum ${minPlayers} players required`;
        }

        formData.players.forEach((player, index) => {
            if (player.name.trim() && !player.position.trim()) {
                newErrors[`player${index}position`] = 'Position is required';
            }
            if (player.name.trim() && !player.number.trim()) {
                newErrors[`player${index}number`] = 'Number is required';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (step === 2 && validateStep2()) {
            setIsSubmitting(true);
            try {
                await onSubmit(formData);
                onClose();
            } catch (error) {
                console.error('Error submitting form:', error);
                setErrors({ submit: 'Failed to submit registration. Please try again.' });
            } finally {
                setIsSubmitting(false);
            }
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

                    <div className="flex justify-center mt-4">
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                                }`}>
                                1
                            </div>
                            <div className={`w-16 h-1 ${step === 2 ? 'bg-blue-600' : 'bg-blue-100'
                                }`}></div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                                }`}>
                                2
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Team Name *</label>
                                <input
                                    type="text"
                                    value={formData.teamName}
                                    onChange={e => setFormData({ ...formData, teamName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                                    placeholder="Enter team name"
                                />
                                {errors.teamName && (
                                    <p className="text-red-500 text-sm mt-1">{errors.teamName}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Team Logo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setFormData({ ...formData, teamLogo: e.target.files?.[0] || null })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Contact Name *</label>
                                <input
                                    type="text"
                                    value={formData.contactName}
                                    onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                                    placeholder="Enter contact person's name"
                                />
                                {errors.contactName && (
                                    <p className="text-red-500 text-sm mt-1">{errors.contactName}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Contact Email *</label>
                                <input
                                    type="email"
                                    value={formData.contactEmail}
                                    onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                                    placeholder="Enter contact email"
                                />
                                {errors.contactEmail && (
                                    <p className="text-red-500 text-sm mt-1">{errors.contactEmail}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Contact Phone *</label>
                                <input
                                    type="tel"
                                    value={formData.contactPhone}
                                    onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                                    placeholder="Enter contact phone number"
                                />
                                {errors.contactPhone && (
                                    <p className="text-red-500 text-sm mt-1">{errors.contactPhone}</p>
                                )}
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button variant="outline" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button onClick={handleNext}>
                                    Next
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-lg font-medium mb-4">Player Information</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Minimum {minPlayers} players required. You can add up to {maxPlayers} players.
                            </p>

                            {errors.players && (
                                <p className="text-red-500 text-sm mb-4">{errors.players}</p>
                            )}

                            <div className="space-y-4">
                                {formData.players.map((player, index) => (
                                    <div key={index} className="grid grid-cols-3 gap-4">
                                        <div>
                                            <input
                                                type="text"
                                                value={player.name}
                                                onChange={e => {
                                                    const newPlayers = [...formData.players];
                                                    newPlayers[index].name = e.target.value;
                                                    setFormData({ ...formData, players: newPlayers });
                                                }}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                                                placeholder="Player name"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                value={player.position}
                                                onChange={e => {
                                                    const newPlayers = [...formData.players];
                                                    newPlayers[index].position = e.target.value;
                                                    setFormData({ ...formData, players: newPlayers });
                                                }}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                                                placeholder="Position"
                                            />
                                            {errors[`player${index}position`] && (
                                                <p className="text-red-500 text-sm mt-1">{errors[`player${index}position`]}</p>
                                            )}
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                value={player.number}
                                                onChange={e => {
                                                    const newPlayers = [...formData.players];
                                                    newPlayers[index].number = e.target.value;
                                                    setFormData({ ...formData, players: newPlayers });
                                                }}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                                                placeholder="Number"
                                            />
                                            {errors[`player${index}number`] && (
                                                <p className="text-red-500 text-sm mt-1">{errors[`player${index}number`]}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {formData.players.length < maxPlayers && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setFormData({
                                                ...formData,
                                                players: [
                                                    ...formData.players,
                                                    { name: '', position: '', number: '' }
                                                ]
                                            });
                                        }}
                                        className="w-full"
                                    >
                                        Add Player
                                    </Button>
                                )}
                            </div>

                            <div className="flex justify-between mt-6">
                                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                                    Back
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                                </Button>
                            </div>

                            {errors.submit && (
                                <p className="text-red-500 text-sm mt-4 text-center">{errors.submit}</p>
                            )}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
} 