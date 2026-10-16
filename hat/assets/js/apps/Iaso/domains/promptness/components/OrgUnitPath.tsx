import React, { FunctionComponent, useMemo } from 'react';
import { Breadcrumbs, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useGenUrl } from 'Iaso/routing/routing';
import { useOrgUnitBreadCrumbs } from '../../orgUnits/components/breadcrumbs/OrgUnitBreadcrumbs';
import { OrgUnit } from '../../orgUnits/types/orgUnit';

type Props = {
    // The org unit currently displayed (drilled down from the table)
    orgUnit?: OrgUnit;
    // The parent org unit selected in the filters, root of the path
    rootId?: string;
};

// Path from the parent org unit of the filters to the displayed org unit,
// each ancestor links back to its own figures
export const OrgUnitPath: FunctionComponent<Props> = ({ orgUnit, rootId }) => {
    const genUrl = useGenUrl();
    const ancestors = useOrgUnitBreadCrumbs({ orgUnit });
    const path = useMemo(() => {
        const rootIndex = ancestors.findIndex(
            ancestor => `${ancestor.id}` === rootId,
        );
        return rootIndex === -1 ? ancestors : ancestors.slice(rootIndex);
    }, [ancestors, rootId]);

    return (
        <Breadcrumbs separator="›" sx={{ fontSize: 'inherit' }}>
            {path.map((ancestor, index) =>
                index === path.length - 1 ? (
                    <Typography
                        key={ancestor.id}
                        variant="body2"
                        color="text.primary"
                        fontWeight="medium"
                    >
                        {ancestor.name}
                    </Typography>
                ) : (
                    <Link
                        key={ancestor.id}
                        component={RouterLink}
                        variant="body2"
                        underline="hover"
                        to={genUrl({
                            orgUnitId:
                                `${ancestor.id}` === rootId
                                    ? undefined
                                    : `${ancestor.id}`,
                            orgUnitTypeIds: undefined,
                            page: null,
                        })}
                    >
                        {ancestor.name}
                    </Link>
                ),
            )}
        </Breadcrumbs>
    );
};
