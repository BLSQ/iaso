/* eslint-disable camelcase */
import { UrlParams } from 'bluesquare-components';
import { TeamType } from '../constants';

export type SubTeam = {
    id: number;
    name: string;
    deleted_at?: string;
};

export type User = {
    id: number;
    username: string;
};

export type Team = {
    id: number;
    name: string;
    description?: string;
    manager: number;
    sub_teams: Array<number>;
    sub_teams_details: Array<SubTeam>;
    project: number;
    type?: TeamType;
    users: Array<number>;
    users_details: Array<User>;
    created_at: string;
    deleted_at?: string;
    parent?: number;
};
export type TeamFilterParams = {
    dateTo?: string;
    dateFrom?: string;
    project?: number;
    type?: TeamType;
};

export type TeamParams = UrlParams &
    TeamFilterParams & {
        select?: (
            // eslint-disable-next-line no-unused-vars
            data: Array<Team>,
        ) => Array<any>;
    };

export type DropdownTeamsOptions = {
    label: string;
    value: string;
    original: Team;
};
