import { TEAM_OF_TEAMS, TEAM_OF_USERS, TeamType } from './constants';
import { Team } from './types/team';

type TeamWithType = Pick<Team, 'type'>;

export const canHaveSubTeams = ({ type }: TeamWithType): boolean =>
    type !== TEAM_OF_USERS;

export const canHaveUsers = ({ type }: TeamWithType): boolean =>
    type !== TEAM_OF_TEAMS;

export const getToggledType = ({ type }: TeamWithType): TeamType =>
    type === TEAM_OF_USERS ? TeamType.TEAM_OF_TEAMS : TeamType.TEAM_OF_USERS;
