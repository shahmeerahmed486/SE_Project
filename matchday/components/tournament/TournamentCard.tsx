import Link from 'next/link';
import Image from 'next/image';

interface TournamentCardProps {
    tournament: {
        id: string;
        name: string;
        image: string;
        startDate: string;
        endDate: string;
        format: string;
        registrationStatus: string;
        teamsRegistered: number;
        maxTeams: number;
        location: string;
        description: string;
    };
}

export default function TournamentCard({ tournament }: TournamentCardProps) {
    // Format dates
    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <Link href={`/tournaments/${tournament.id}`} className="block h-full">
            <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
                <div className="relative h-48">
                    <div className="absolute inset-0 bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    {tournament.image && (
                        <Image
                            src={tournament.image}
                            alt={tournament.name}
                            fill
                            className="object-cover"
                        />
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                        <h3 className="text-white font-bold text-lg truncate">{tournament.name}</h3>
                        <p className="text-white text-sm opacity-90">{tournament.location}</p>
                    </div>

                    <div className="absolute top-3 right-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${tournament.registrationStatus === 'open'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                            {tournament.registrationStatus === 'open' ? 'Registration Open' : 'Registration Closed'}
                        </span>
                    </div>
                </div>

                <div className="p-4 flex-grow">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                            </p>
                        </div>
                        <span className="text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">
                            {tournament.format}
                        </span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {tournament.description}
                    </p>

                    <div className="mt-auto">
                        <div className="flex items-center justify-between">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{ width: `${(tournament.teamsRegistered / tournament.maxTeams) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {tournament.teamsRegistered} of {tournament.maxTeams} teams registered
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    );
} 