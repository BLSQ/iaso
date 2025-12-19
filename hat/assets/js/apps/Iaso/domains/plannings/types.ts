import { UrlParams } from 'bluesquare-components';
import { TaskStatus } from 'Iaso/domains/tasks/types';

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
    team: number;
    org_unit: number;
    org_unit_details?: PlanningOrgUnitDetails;
    forms: number[];
    project: number;
    project_details?: PlanningProjectDetails;
    description?: string;
    published_at?: string;
    started_at?: string;
    ended_at?: string;
    pipeline_uuids: string[];
    target_org_unit_type?: number;
    target_org_unit_type_details?: PlanningTargetOrgUnitTypeDetails | null;
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
    created_at: string;
    created_by: number;
    created_by_details: UserDetails;
};
