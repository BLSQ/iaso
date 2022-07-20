export const findApprovaTeams = teams => {
    return teams
        .filter(team => team.name.toLowerCase().includes('approval'))
        .map(team => team.id);
};
