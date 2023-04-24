import React, { FunctionComponent, useMemo } from 'react';
import { Breadcrumbs } from '@material-ui/core';
import { OrgUnit } from '../../types/orgUnit';
import { LinkToOrgUnit } from '../LinkToOrgUnit';

export const getBreadcrumbs = (
    orgUnit?: OrgUnit,
    list: OrgUnit[] = [],
): OrgUnit[] => {
    if (!orgUnit) return list;
    if (!orgUnit.parent) {
        list.push(orgUnit);
        return list;
    }
    list.push(orgUnit.parent);
    return getBreadcrumbs(orgUnit.parent, list);
};

export const useOrgUnitBreadCrumbs = (orgUnit?: OrgUnit): OrgUnit[] => {
    return useMemo(() => {
        return getBreadcrumbs(orgUnit).reverse();
    }, [orgUnit]);
};

type Props = {
    separator?: string;
    breadcrumbs: OrgUnit[];
};

export const OrgUnitBreadcrumbs: FunctionComponent<Props> = ({
    separator = '>',
    breadcrumbs,
}) => {
    return (
        <Breadcrumbs separator={separator}>
            {breadcrumbs.map(ou => {
                return <LinkToOrgUnit orgUnit={ou} key={ou.id} />;
            })}
        </Breadcrumbs>
    );
};
