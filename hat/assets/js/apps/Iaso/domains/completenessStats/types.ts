import { Paginated, UrlParams } from 'bluesquare-components';
import { NameAndId } from '../../types/utils';
import { OrgUnitStatus } from '../orgUnits/types/orgUnit';
import { Shape } from '../orgUnits/types/shapes';
import { ScaleThreshold } from '../../components/LegendBuilder/types';

export type FormDesc = {
    id: number;
    name: string;
    slug: string;
};

export type FormStat = {
    descendants: number; // int
    descendants_ok: number; // int
    percent: number; // on 1
    total_instances: number; // total number of instance
    name: string; // Name of the form (for debug)
    itself_target: number; // Does this orgunit need to fill 0 if No, 1 if yes
    itself_has_instances: number; // Does this orgunit has submission? (idem)
    itself_instances_count: number; // Number of submission on this orgunit
    legend_threshold: ScaleThreshold; // Legend used to display colors per form
};

export type CompletenessStats = {
    parent_org_unit?: NameAndId;
    org_unit_type?: NameAndId;
    org_unit: NameAndId;
    form_stat: FormStat;
    has_children: boolean;
};

// Api add some metadata to help column creation
export type CompletenessApiResponse = Paginated<CompletenessStats> & {
    forms: FormDesc[];
};

export type ParentOrgUnit = { name: string; id: number; parent: NameAndId };
export type CompletenessMapStats = {
    altitude?: number;
    form_stats: Record<string, FormStat>;
    geo_json?: Shape | undefined;
    has_geo_json: boolean;
    id: number;
    is_root?: boolean;
    latitude?: number;
    longitude?: number;
    name: string;
    org_unit_type?: NameAndId;
    parent_org_unit?: ParentOrgUnit;
    has_children: boolean;
};
// Api add some metadata to help column creation
export type CompletenessMapApiResponse = {
    results: CompletenessMapStats[];
};

export type FormStatRow = {
    value: FormStat;
};
export type CompletenessRouterParams = UrlParams & {
    formId?: string;
    orgUnitTypeIds?: string;
    orgunitValidationStatus: OrgUnitStatus;
    period?: string;
    groupId?: string;
    parentId?: string;
    accountId?: string;
    planningId?: string;
    tab?: 'list' | 'map';
    showDirectCompleteness: 'true' | 'false';
};
