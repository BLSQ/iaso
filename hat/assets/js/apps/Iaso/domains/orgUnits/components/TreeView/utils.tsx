import React, { ReactElement } from 'react';
import { OrgUnit } from '../../types/orgUnit';
import { getOrgUnitAncestors } from '../../utils';
import OrgUnitTooltip from '../OrgUnitTooltip';

export const formatInitialSelectedIds = (
    orgUnits: OrgUnit | OrgUnit[] | undefined,
): string[] | string => {
    if (!orgUnits) return [];
    if (!Array.isArray(orgUnits)) return orgUnits.id.toString();
    return orgUnits.map(orgUnit => orgUnit.id.toString());
};

export const formatInitialSelectedParents = (
    orgUnits: OrgUnit | OrgUnit[] | undefined,
): Map<string, string[]> => {
    const parents = new Map();
    if (!orgUnits) return parents;
    if (!Array.isArray(orgUnits)) {
        parents.set(orgUnits.id.toString(), getOrgUnitAncestors(orgUnits));
    }
    if (Array.isArray(orgUnits)) {
        orgUnits.forEach(orgUnit => {
            parents.set(orgUnit.id.toString(), getOrgUnitAncestors(orgUnit));
        });
    }
    return parents;
};
export const tooltip = (orgUnit: OrgUnit, icon: ReactElement): ReactElement => (
    <OrgUnitTooltip orgUnit={orgUnit} enterDelay={0} enterNextDelay={0}>
        {icon}
    </OrgUnitTooltip>
);
