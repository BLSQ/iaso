import { UrlParams } from 'bluesquare-components';

export type PublishingStatus = 'all' | 'draft' | 'published';

export type PlanningParams = UrlParams & {
    publishingStatus: PublishingStatus;
    dateTo?: string;
    dateFrom?: string;
};

export type SamplingResult = {
    id: number;
    created_at: string;
    pipeline_name: string;
    group_id: number;
    group_details: {
        org_unit_count: number;
    };
};
