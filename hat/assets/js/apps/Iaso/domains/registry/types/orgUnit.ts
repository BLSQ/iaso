/* eslint-disable camelcase */

export type OrgUnit = {
    name: string;
    id: number;
    validation_status: 'NEW' | 'VALID' | 'REJECTED';
    parent: OrgUnit;
    org_unit_type_id: number;
    has_children: boolean;
};
