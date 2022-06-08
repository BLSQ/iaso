/* eslint-disable camelcase */

export type AssignmentParams = {
    planningId: string;
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
