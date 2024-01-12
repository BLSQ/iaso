import React, { FunctionComponent, useMemo } from 'react';
import { Breadcrumbs } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { OrgUnit } from '../../types/orgUnit';
import { LinkToOrgUnit } from '../LinkToOrgUnit';
import { LinkToRegistry } from '../../../registry/components/LinkToRegistry';

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

const useStyles = makeStyles(theme => {
    return {
        // @ts-ignore
        link: { color: theme.palette.mediumGray.main },
    };
});

type Props = {
    separator?: string;
    orgUnit: OrgUnit;
    showOnlyParents?: boolean;
    showRegistry?: boolean;
};

export const OrgUnitBreadcrumbs: FunctionComponent<Props> = ({
    separator = '>',
    orgUnit,
    showOnlyParents,
    showRegistry = false,
}) => {
    const { link } = useStyles();
    const breadcrumbs = useOrgUnitBreadCrumbs({ orgUnit, showOnlyParents });
    return (
        <Breadcrumbs separator={separator}>
            {breadcrumbs.map(ou =>
                showRegistry ? (
                    <LinkToRegistry
                        orgUnit={ou}
                        key={ou.id}
                        className={link}
                        replace
                    />
                ) : (
                    <LinkToOrgUnit
                        orgUnit={ou}
                        key={ou.id}
                        className={link}
                        replace
                    />
                ),
            )}
        </Breadcrumbs>
    );
};
