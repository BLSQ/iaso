import { keyBy } from 'lodash';
import { HierarchyTeam } from '../teamHierarchy/types';

export const getTeamChain = (
    teams: HierarchyTeam[],
    teamId: number,
): HierarchyTeam[] => {
    const teamsById = keyBy(teams, 'id');
    const chain: HierarchyTeam[] = [];
    let team: HierarchyTeam | undefined = teamsById[teamId];
    while (team) {
        chain.unshift(team);
        team = team.parent ? teamsById[team.parent] : undefined;
    }
    return chain;
};
