import { Breadcrumbs, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { FunctionComponent, useMemo } from 'react';
import { OrgUnit } from '../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';
import { LinkToRegistry } from './LinkToRegistry';

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
    list.push(orgUnit.parent as OrgUnit);
    return getBreadcrumbs({
        orgUnit: orgUnit.parent as OrgUnit,
        list,
        showOnlyParents,
    });
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
    color?: string;
    params?: Record<string, string>;
};

export const RegistryBreadcrumbs: FunctionComponent<Props> = ({
    separator = '>',
    orgUnit,
    showOnlyParents,
    color = 'inherit',
    params = {},
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
                return (
                    <LinkToRegistry
                        orgUnit={ou}
                        key={ou.id}
                        className={link}
                        replace
                        params={params}
                    />
                );
            })}
        </Breadcrumbs>
    );
};
