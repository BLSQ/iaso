import { UrlParams } from '../../../types/table';

export type OrgUnitListTab = 'map' | 'list';

export type RegistryDetailParams = UrlParams & {
    orgUnitId: string;
    accountId: string;
    formIds?: string;
    columns?: string;
    tab?: string;
    orgUnitListTab?: OrgUnitListTab;
    orgUnitListPageSize?: string;
    orgUnitListOrder?: string;
    orgUnitListPage?: string;
    submissionId?: string;
};
