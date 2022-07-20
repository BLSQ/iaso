/* eslint-disable camelcase */
import { OrgunitType } from './orgunitTypes';
import { Group } from './group';
import { Search } from './search';

export type SaveData = {
    groups_added?: Array<Group>;
    groups_removed?: Array<Group>;
    org_unit_type?: OrgunitType;
    validation_status?: string;
    selected_ids?: Array<number>;
    unselected_ids?: Array<number>;
    select_all?: boolean;
    searches?: [Search];
};
