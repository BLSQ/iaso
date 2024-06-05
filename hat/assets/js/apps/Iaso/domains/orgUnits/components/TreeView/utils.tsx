import React, { ReactElement } from 'react';
import { OrgUnit, OrgUnitStatus, ParentOrgUnit } from '../../types/orgUnit';
import OrgUnitTooltip from '../OrgUnitTooltip';

export const formatInitialSelectedIds = (
    orgUnits: OrgUnit | OrgUnit[] | undefined,
): string[] | string => {
    if (!orgUnits) return [];
    if (!Array.isArray(orgUnits)) return orgUnits.id.toString();
    return orgUnits.map(orgUnit => orgUnit.id.toString());
};

export const tooltip = (orgUnit: OrgUnit, icon: ReactElement): ReactElement => (
    <OrgUnitTooltip orgUnit={orgUnit} enterDelay={0} enterNextDelay={0}>
        {icon}
    </OrgUnitTooltip>
);

export const getOrgUnitParents = (
    orgUnit: OrgUnit | ParentOrgUnit,
): OrgUnit[] => {
    if (!orgUnit.parent) return [];
    return [
        orgUnit.parent as OrgUnit,
        ...getOrgUnitParents(orgUnit.parent as OrgUnit),
    ];
};

export const getOrgUnitParentsString = (orgUnit: OrgUnit): string =>
    getOrgUnitParents(orgUnit)
        .map(ou => (ou.name !== '' ? ou.name : ou.org_unit_type_name))
        .reverse()
        .join(' > ');

export const getOrgUnitParentsIds = (
    orgUnit: OrgUnit | ParentOrgUnit,
): number[] =>
    getOrgUnitParents(orgUnit)
        .map(ou => ou.id)
        .reverse();

const getOrgUnitsParentsUntilRoot = (
    orgUnit: OrgUnit | ParentOrgUnit,
    parents: ParentOrgUnit[] = [],
): ParentOrgUnit[] => {
    let parentsList: ParentOrgUnit[] = [...parents];
    parentsList.push(orgUnit as ParentOrgUnit);
    if (orgUnit.parent) {
        parentsList = getOrgUnitsParentsUntilRoot(orgUnit.parent, parentsList);
    }
    return parentsList;
};

export const getOrgUnitAncestorsIds = (
    orgUnit: OrgUnit | ParentOrgUnit,
): number[] => {
    const result = getOrgUnitParentsIds(orgUnit);
    // Adding id of the org unit in case it's a root
    // and to be able to select it with the treeview
    result.push(orgUnit.id);
    return result;
};

export const getOrgUnitAncestors = (orgUnit: OrgUnit): Map<string, any> => {
    const result = new Map<
        string,
        {
            name: string;
            id: string;
            validation_status: OrgUnitStatus | undefined;
        }
    >(
        getOrgUnitsParentsUntilRoot(orgUnit)
            .map(
                parent =>
                    [
                        parent.id.toString(),
                        {
                            // selecting the necessary fields, as there are many more than those returned by the API used in the treeview itself
                            // this will allow to use the same label formatting function in the TruncatedTreeview and in the Treeview
                            name: parent.name,
                            id: parent.id.toString(),
                            validation_status: parent.validation_status,
                        },
                    ] as [
                        string,
                        {
                            name: string;
                            id: string;
                            validation_status: OrgUnitStatus | undefined;
                        },
                    ],
            )
            .reverse(),
    );
    return result;
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
