import { UrlParams } from '../../../types/table';

export type RegistryDetailParams = UrlParams & {
    orgUnitId: string;
    accountId: string;
    formId?: string;
};
