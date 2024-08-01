import { Pagination, UrlParams } from 'bluesquare-components';
import { OrgUnit } from '../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';
import { OrgunitType } from '../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgunitTypes';

export type OrgUnitListChildren = Pagination & {
    orgunits: OrgUnit[];
};
export type OrgunitTypeRegistry = OrgunitType & {
    orgUnits: OrgUnit[];
};

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
};
