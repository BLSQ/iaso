import { UrlParams } from '../../types/table';

export type PublishingStatus = 'all' | 'draft' | 'published';

export type PlanningParams = UrlParams & {
    publishingStatus: PublishingStatus;
    dateTo?: string;
    dateFrom?: string;
};
