import { HierarchyTeam } from '../teamHierarchy/types';
import { getTeamChain } from './utils';

const makeTeam = (id: number, parent?: number): HierarchyTeam =>
    ({ id, name: `Team ${id}`, parent }) as HierarchyTeam;

const teams = [makeTeam(1, 99), makeTeam(2, 1), makeTeam(3, 2), makeTeam(4, 1)];

describe('getTeamChain', () => {
    it('returns the teams from the root of the hierarchy down to the given team', () => {
        expect(getTeamChain(teams, 3).map(team => team.id)).toEqual([1, 2, 3]);
    });

    it('returns only the root team when it is the given team', () => {
        expect(getTeamChain(teams, 1).map(team => team.id)).toEqual([1]);
    });

    it('returns an empty chain when the team is not in the hierarchy', () => {
        expect(getTeamChain(teams, 42)).toEqual([]);
    });
});
