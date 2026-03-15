import { UrlParams } from 'bluesquare-components';

export type MissionType = 'FORM_FILLING' | 'ORG_UNIT_AND_FORM' | 'ENTITY_AND_FORM';

export type MissionParams = UrlParams & {
    search?: string;
    missionType?: MissionType;
};

export type MissionFormEntry = {
    id: number;
    form: { id: number; name: string };
    min_cardinality: number;
    max_cardinality: number | null;
};

export type Mission = {
    id: number;
    name: string;
    account: number;
    mission_type: MissionType;
    mission_forms: MissionFormEntry[];
    org_unit_type?: { id: number; name: string } | null;
    org_unit_min_cardinality?: number | null;
    org_unit_max_cardinality?: number | null;
    entity_type?: { id: number; name: string } | null;
    entity_min_cardinality?: number | null;
    entity_max_cardinality?: number | null;
    created_by?: number | null;
    created_at?: string;
    updated_at?: string;
};
