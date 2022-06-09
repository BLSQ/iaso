/* eslint-disable camelcase */

export type AssignmentParams = {
    planningId: string;
    team?: string;
    orgunitType?: string;
    tab?: string;
};

export type AssignmentApi = {
    id: number;
    name: string;
    description?: string;
    team: number;
    team_details: { name: string; id: number };
    published_at?: string;
    started_at?: string;
    ended_at?: string;
};

export type AssignmentsApi = AssignmentApi[];
