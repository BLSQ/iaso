import { Shape } from '../../orgUnits/types/shapes';

export type AssignmentParams = {
    planningId: string;
    tab?: 'list' | 'map';
    pageSize?: string;
    page?: string;
    order?: string;
    search?: string;
    orgUnitParentId?: string;
    orgUnitTypeIds?: string;
};

type OrgUnitDetails = {
    id: number;
    name: string;
    org_unit_type?: number;
    geo_json: Shape | null;
    latitude: number | null;
    longitude: number | null;
};

export type AssignmentApi = {
    id: number;
    planning: number;
    user: number;
    team: number;
    org_unit: number;
    org_unit_details: OrgUnitDetails;
};

export type SaveAssignmentQuery = {
    id?: number;
    planning: number;
    org_unit: number;
    team?: number | null;
    user?: number | null;
};

export type BulkSaveAssignmentQuery = {
    id?: number;
    planning: number;
    select_all: boolean;
    selected_ids: number[];
    unselected_ids: number[];
    org_unit_parent_id?: number;
    org_unit_type_ids?: number[];
    search?: string;
    team?: number | null;
    user?: number | null;
};
export type AssignmentsResult = {
    assignments: AssignmentApi[];
    allAssignments: AssignmentApi[];
};
