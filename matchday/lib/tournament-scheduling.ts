import { Match, Tournament } from "@/types";

// Helper function to generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Shuffles an array using Fisher-Yates algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Generate league format matches (round-robin)
export function generateLeagueMatches(
  teams: { id: string; name: string }[],
  tournamentId: string
): Match[] {
  const matches: Match[] = [];
  
  // Need at least 2 teams to create a schedule
  if (teams.length < 2) return matches;
  
  // For a round-robin tournament, each team plays against all other teams
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const now = new Date();
      matches.push({
        id: generateId(),
        tournamentId,
        teamA: teams[i].id,
        teamB: teams[j].id,
        date: new Date(now.setDate(now.getDate() + matches.length)).toISOString().split('T')[0],
        time: "14:00",
        location: "TBD",
        scoreA: null,
        scoreB: null,
        status: "SCHEDULED",
        updatedAt: new Date().toISOString(),
      });
    }
  }
  
  return matches;
}

// Generate knockout format matches
export function generateKnockoutMatches(
  teams: { id: string; name: string }[],
  tournamentId: string
): Match[] {
  const matches: Match[] = [];
  
  // Need at least 2 teams to create a schedule
  if (teams.length < 2) return matches;
  
  // Shuffle teams to randomize brackets
  const shuffledTeams = shuffleArray(teams);
  
  // Calculate the number of rounds needed
  const numRounds = Math.ceil(Math.log2(shuffledTeams.length));
  
  // Calculate the total number of matches needed
  const totalMatches = Math.pow(2, numRounds) - 1;
  
  // Calculate the number of first-round matches (could be less than a full round if team count is not a power of 2)
  const firstRoundMatches = shuffledTeams.length - Math.pow(2, numRounds - 1);
  
  // Generate first round matches
  for (let i = 0; i < firstRoundMatches; i++) {
    const now = new Date();
    matches.push({
      id: generateId(),
      tournamentId,
      teamA: shuffledTeams[i * 2].id,
      teamB: shuffledTeams[i * 2 + 1].id,
      round: "R1",
      date: new Date(now.setDate(now.getDate() + 1)).toISOString().split('T')[0],
      time: "14:00",
      location: "TBD",
      scoreA: null,
      scoreB: null,
      status: "SCHEDULED",
      updatedAt: new Date().toISOString(),
    });
  }
  
  // Generate placeholder matches for subsequent rounds
  const remainingRounds = numRounds - 1;
  let matchesInPreviousRound = firstRoundMatches;
  
  for (let round = 1; round <= remainingRounds; round++) {
    const matchesInThisRound = Math.pow(2, remainingRounds - round);
    const teamsWithByes = shuffledTeams.slice(firstRoundMatches * 2);
    
    for (let i = 0; i < matchesInThisRound; i++) {
      const now = new Date();
      let teamA = "TBD";
      let teamB = "TBD";
      
      // For the first round with byes, use the teams that got a bye
      if (round === 1 && teamsWithByes.length > 0) {
        if (i * 2 < teamsWithByes.length) teamA = teamsWithByes[i * 2].id;
        if (i * 2 + 1 < teamsWithByes.length) teamB = teamsWithByes[i * 2 + 1].id;
      }
      
      matches.push({
        id: generateId(),
        tournamentId,
        teamA,
        teamB,
        round: `R${round + 1}`,
        date: new Date(now.setDate(now.getDate() + round + 1)).toISOString().split('T')[0],
        time: "14:00",
        location: "TBD",
        scoreA: null,
        scoreB: null,
        status: "SCHEDULED",
        updatedAt: new Date().toISOString(),
      });
    }
    
    matchesInPreviousRound = matchesInThisRound;
  }
  
  return matches;
}

// Generate group stage matches for tournaments with group + knockout format
export function generateGroupMatches(
  teams: { id: string; name: string }[],
  tournamentId: string,
  numGroups: number = 4
): { matches: Match[]; groups: { [key: string]: string[] } } {
  const matches: Match[] = [];
  const groups: { [key: string]: string[] } = {};
  
  // Need at least numGroups teams
  if (teams.length < numGroups) return { matches, groups };
  
  // Shuffle teams for random group assignment
  const shuffledTeams = shuffleArray(teams);
  
  // Create groups (A, B, C, D...)
  for (let i = 0; i < numGroups; i++) {
    const groupName = String.fromCharCode(65 + i); // A, B, C, etc.
    groups[groupName] = [];
  }
  
  // Assign teams to groups
  for (let i = 0; i < shuffledTeams.length; i++) {
    const groupIndex = i % numGroups;
    const groupName = String.fromCharCode(65 + groupIndex);
    groups[groupName].push(shuffledTeams[i].id);
  }
  
  // Generate matches within each group (round-robin)
  for (const groupName in groups) {
    const groupTeams = groups[groupName].map(teamId => {
      const team = teams.find(t => t.id === teamId);
      return { id: teamId, name: team?.name || "Unknown" };
    });
    
    // Create round-robin matches within this group
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        const now = new Date();
        matches.push({
          id: generateId(),
          tournamentId,
          teamA: groupTeams[i].id,
          teamB: groupTeams[j].id,
          round: `Group ${groupName}`,
          date: new Date(now.setDate(now.getDate() + matches.length)).toISOString().split('T')[0],
          time: "14:00",
          location: "TBD",
          scoreA: null,
          scoreB: null,
          status: "SCHEDULED",
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }
  
  return { matches, groups };
}

// Main function to generate schedule based on tournament format
export function generateSchedule(
  tournament: Tournament,
  teams: { id: string; name: string }[]
): { matches: Match[]; groups?: { [key: string]: string[] } } {
  switch (tournament.format) {
    case "LEAGUE":
      return { matches: generateLeagueMatches(teams, tournament.id) };
    
    case "KNOCKOUT":
      return { matches: generateKnockoutMatches(teams, tournament.id) };
      
    case "GROUP_KNOCKOUT": {
      // First generate group stage
      const { matches: groupMatches, groups } = generateGroupMatches(
        teams, 
        tournament.id, 
        Math.min(4, Math.floor(teams.length / 2)) // Determine reasonable number of groups
      );
      
      // We would generate knockout stage matches after group stage is completed
      // For now, we just return the group stage matches
      return { matches: groupMatches, groups };
    }
    
    default:
      return { matches: [] };
  }
} 