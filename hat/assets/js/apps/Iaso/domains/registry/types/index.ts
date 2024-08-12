import { UrlParams } from 'bluesquare-components';

export type OrgUnitListTab = 'map' | 'list';

export type RegistryParams = UrlParams & {
    orgUnitId: string;
    orgUnitChildrenId?: string;
    formIds?: string;
    planningIds?: string;
    columns?: string;
    tab?: string;
    orgUnitListTab?: OrgUnitListTab;
    orgUnitListPageSize?: string;
    orgUnitListOrder?: string;
    orgUnitListPage?: string;
    submissionId?: string;
    missingSubmissionVisible?: 'true';
    showTooltip?: 'true';
    clusterEnabled?: 'true';
    fullScreen?: 'true';
    missingSubmissionsPageSize?: string;
    missingSubmissionsOrder?: string;
    missingSubmissionsPage?: string;
    projectIds?: string;
};
