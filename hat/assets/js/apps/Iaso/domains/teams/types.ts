import { UrlParams } from '../../types/table';

export type TeamParams = UrlParams & {
    dateTo?: string;
    dateFrom?: string;
};
