import { UrlParams } from 'bluesquare-components';
import { TeamType } from '../constants';

export type SubTeam = {
    id: number;
    name: string;
    deleted_at?: string;
    color: string;
};

export type User = {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    color: string;
    iaso_profile_id: number;
};

export type Team = {
    id: number;
    name: string;
    description?: string;
    manager: number;
    sub_teams: Array<number>;
    project: number;
    type?: TeamType;
    users: Array<number>;
    created_at: string;
    deleted_at?: string;
    parent?: number;
    color: string;
    members_count?: number;
};

export type TeamTreeNode = Pick<Team, 'id' | 'name' | 'type' | 'color'> & {
    parent: number | null;
    depth: number;
    users: User[];
    children: TeamTreeNode[];
};

export type TeamFilterParams = {
    project?: number;
    type?: TeamType;
    managers?: number;
    fields?: string;
};

export type TeamUrlParams = UrlParams & TeamFilterParams;
