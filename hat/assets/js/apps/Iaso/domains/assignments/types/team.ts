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
    type?: 'TEAM_OF_TEAMS' | 'TEAM_OF_USERS';
    users: Array<number>;
    users_details: Array<User>;
    created_at: string;
    deleted_at?: string;
    parent?: number;
};

export type DropdownTeamsOptions = {
    label: string;
    value: string;
    original: Team;
    color: string;
};
export type Teams = Team[];
