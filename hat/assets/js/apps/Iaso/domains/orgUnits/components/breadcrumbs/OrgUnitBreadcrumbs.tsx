import { Breadcrumbs, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { FunctionComponent, useMemo } from 'react';
import { LinkToRegistry } from '../../../registry/components/LinkToRegistry';
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
    color?: string;
};

export const OrgUnitBreadcrumbs: FunctionComponent<Props> = ({
    separator = '>',
    orgUnit,
    showOnlyParents,
    showRegistry = false,
    color = 'inherit',
}) => {
    const { link } = useStyles();
    const breadcrumbs = useOrgUnitBreadCrumbs({ orgUnit, showOnlyParents });
    return (
        <Breadcrumbs separator={separator} sx={{ '& *': { color } }}>
            {breadcrumbs.map((ou, index) => {
                if (index === breadcrumbs.length - 1 && !showOnlyParents) {
                    return (
                        <Typography
                            key={ou.id}
                            component="span"
                            color="primary"
                        >
                            {ou.name}
                        </Typography>
                    );
                }
                return showRegistry ? (
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
                );
            })}
        </Breadcrumbs>
    );
};
