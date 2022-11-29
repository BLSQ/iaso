import { Paginated } from '../../types/table';
import { NameAndId } from '../../types/utils';

/* eslint-disable camelcase */
export type CompletenessStats = {
    parent_org_unit?: NameAndId;
    org_unit_type?: NameAndId;
    org_unit: NameAndId;
    form?: NameAndId;
    forms_filled: number;
    forms_to_fill: number;
    completeness_ratio: number;
};

export type CompletenessApiResponse = Paginated<CompletenessStats>;
