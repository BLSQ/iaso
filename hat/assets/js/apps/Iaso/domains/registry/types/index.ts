import { UrlParams } from '../../../types/table';

export type RegistryDetailParams = UrlParams & {
    orgUnitId: string;
    accountId: string;
    formIds?: string;
    columns?: string;
};
