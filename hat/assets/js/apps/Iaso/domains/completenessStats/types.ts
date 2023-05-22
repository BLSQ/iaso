import { Paginated, UrlParams } from '../../types/table';
import { NameAndId } from '../../types/utils';

export type FormDesc = {
    id: number;
    name: string;
    slug: string;
};

/* eslint-disable camelcase */
export type FormStat = {
    descendants: number; // int
    descendants_ok: number; // int
    percent: number; // on 1
    total_instances: number; // total number of instance
    name: string; // Name of the form (for debug)
    itself_target: number; // Does this orgunit need to fill 0 if No, 1 if yes
    itself_has_instances: number; // Does this orgunit has submission? (idem)
    itself_instances_count: number; // Number of submission on this orgunit
};

/* eslint-disable camelcase */
export type CompletenessStats = {
    parent_org_unit?: NameAndId;
    org_unit_type?: NameAndId;
    org_unit: NameAndId;
    form_stat: FormStat;
};

// Api add some metadata to help column creation
export type CompletenessApiResponse = Paginated<CompletenessStats> & {
    forms: FormDesc[];
};

export type FormStatRow = {
    value: FormStat;
};
export type CompletenessRouterParams = UrlParams & {
    formId?: string;
    orgUnitTypeIds?: string;
    orgunitValidationStatus: 'NEW' | 'VALID' | 'REJECTED';
    period?: string;
    groupId?: string;
    parentId?: string;
    accountId?: string;
};
