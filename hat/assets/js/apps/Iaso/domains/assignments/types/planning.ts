// TODO: types are a bit repetitive in micro planning, maybe use a a common types folder
type Team = {
    id: number;
    name: string;
    deleted_at?: string;
};

type OrgUnitDetail = {
    id: number;
    name: string;
    org_unit_type: number;
};

export type Planning = {
    id: number;
    name: string;
    team_details: Partial<Team>;
    team: number;
    org_unit: number;
    forms: Array<number>;
    project: number;
    project_details: { name: string; id: number };
    description?: string;
    published_at?: string;
    started_at?: string;
    ended_at?: string;
    org_unit_details: OrgUnitDetail;
    pipeline_uuids: Array<string>;
    target_org_unit_type?: number;
    target_org_unit_type_details?: { name: string; id: number };
};
