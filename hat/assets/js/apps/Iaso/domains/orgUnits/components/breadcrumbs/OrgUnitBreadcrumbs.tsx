import React, { FunctionComponent, useMemo } from 'react';
import { Breadcrumbs } from '@material-ui/core';
import { OrgUnit } from '../../types/orgUnit';
import { LinkToOrgUnit } from '../LinkToOrgUnit';

type BreadCrumbsArgs = {
    orgUnit?: OrgUnit;
    list?: OrgUnit[];
    showOnlyParents?: boolean;
};

export const getBreadcrumbs = ({
    orgUnit,
    list = [],
    showOnlyParents = false,
}: BreadCrumbsArgs): OrgUnit[] => {
    if (!orgUnit) return list;
    if (list.length === 0 && !showOnlyParents) {
        list.push(orgUnit);
    }
    if (!orgUnit.parent) {
        return list;
    }
    list.push(orgUnit.parent);
    return getBreadcrumbs({ orgUnit: orgUnit.parent, list, showOnlyParents });
};

type UseOrgUnitBreadCrumbsArgs = {
    orgUnit?: OrgUnit;
    showOnlyParents?: boolean;
};

export const useOrgUnitBreadCrumbs = ({
    orgUnit,
    showOnlyParents,
}: UseOrgUnitBreadCrumbsArgs): OrgUnit[] => {
    return useMemo(() => {
        return getBreadcrumbs({ orgUnit, showOnlyParents }).reverse();
    }, [orgUnit, showOnlyParents]);
};

type Props = {
    separator?: string;
    orgUnit: OrgUnit;
    showOnlyParents?: boolean;
};

export const OrgUnitBreadcrumbs: FunctionComponent<Props> = ({
    separator = '>',
    orgUnit,
    showOnlyParents,
}) => {
    const breadcrumbs = useOrgUnitBreadCrumbs({ orgUnit, showOnlyParents });
    return (
        <Breadcrumbs separator={separator}>
            {breadcrumbs.map(ou => {
                return <LinkToOrgUnit orgUnit={ou} key={ou.id} />;
            })}
        </Breadcrumbs>
    );
};
