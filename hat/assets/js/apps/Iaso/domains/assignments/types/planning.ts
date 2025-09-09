// TODO: types are a bit repetitive in micro planning, maybe use a a common types folder
type Team = {
    id: number;
    name: string;
    deleted_at?: string;
};

type OrgUnitDetail = {
    id: number;
    name: string;
    org_unit_type: number | null;
};

export type Planning = {
    id: number;
    name: string;
    team_details: Team;
    team: number;
    org_unit: number;
    forms: Array<number>;
    project: number;
    description?: string;
    published_at?: string;
    started_at?: string;
    ended_at?: string;
    org_unit_details: OrgUnitDetail;
};
