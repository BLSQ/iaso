import { UrlParams } from 'bluesquare-components';
import { GeoJson } from 'Iaso/components/maps/types';
import { TaskStatus } from 'Iaso/domains/tasks/types';
import { Pagination } from 'Iaso/types/general';

export type PublishingStatus = 'all' | 'draft' | 'published';

export type PlanningParams = UrlParams & {
    publishingStatus: PublishingStatus;
    dateTo?: string;
    dateFrom?: string;
};

// Keep in sync with PlanningSerializer swagger schema.
export type PlanningTeamDetails = {
    id: number;
    name: string;
    deleted_at?: string;
    color?: string;
};

export type PlanningOrgUnitDetails = {
    id: number;
    name: string;
    org_unit_type?: number | null;
};

export type PlanningProjectDetails = {
    id: number;
    name: string;
    color?: string;
};

export type PlanningTargetOrgUnitTypeDetails = {
    id: number;
    name: string;
};

export type Planning = {
    id: number;
    name: string;
    team_details?: PlanningTeamDetails;
    org_unit_details?: PlanningOrgUnitDetails;
    forms: number[];
    project_details?: PlanningProjectDetails;
    description?: string;
    published_at?: string;
    started_at?: string;
    ended_at?: string;
    pipeline_uuids: string[];
    target_org_unit_type_details?: PlanningTargetOrgUnitTypeDetails[] | null;
    selected_sampling_result?: SamplingResult;
    assignments_count: number;
};
export type PageMode = 'create' | 'edit' | 'copy';

export type SamplingGroupDetails = {
    id: number;
    name: string;
    org_unit_count: number;
};

export type SamplingTaskDetails = {
    id: number;
    name: string;
    status: TaskStatus;
};

export type UserDetails = {
    id: number;
    username: string;
};

export type SelectedSamplingResult = {
    id: number;
    task_id: number;
    pipeline_id: string;
    pipeline_version: string;
    pipeline_name: string;
    group_id?: number;
};
export type SamplingResult = {
    id: number;
    planning: number;
    task_id: number;
    task_details: SamplingTaskDetails;
    pipeline_id: string;
    pipeline_version: string;
    pipeline_name: string;
    group_id?: number;
    group_details?: SamplingGroupDetails;
    parameters: Record<string, any>;
    created_at: number;
    created_by: number;
    created_by_details: UserDetails;
};
export type PlanningOrgUnits = {
    id: number;
    name: string;
    geo_json: GeoJson;
    has_geo_json: boolean;
    latitude: number;
    longitude: number;
    org_unit_type_id: number;
};

export type User = {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
};
export type Team = {
    id: number;
    name: string;
};
type Assignment = {
    id: number;
    user: User;
    team: Team;
};

export type PaginatedPlanningOrgUnit = {
    id: number;
    name: string;
    assignment: Assignment | null;
};
export interface PaginatedPlanningOrgUnits extends Pagination {
    results: Array<PaginatedPlanningOrgUnit>;
}
