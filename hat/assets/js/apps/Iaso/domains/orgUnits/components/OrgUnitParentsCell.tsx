import React, { FunctionComponent } from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { textPlaceholder } from 'bluesquare-components';
import { OrgUnit } from '../types/orgUnit';
import { getOrgUnitParents } from './TreeView/utils';

type Props = {
    orgUnit: OrgUnit;
};

export const OrgUnitParentsCell: FunctionComponent<Props> = ({ orgUnit }) => {
    // top level first
    const parents = getOrgUnitParents(orgUnit).reverse();
    if (parents.length === 0) {
        return <>{textPlaceholder}</>;
    }
    return (
        <Tooltip
            arrow
            title={parents.map(parent => (
                <Box key={parent.id}>
                    {parent.name || textPlaceholder}
                    {parent.org_unit_type_name &&
                        ` (${parent.org_unit_type_name})`}
                </Box>
            ))}
        >
            <span>
                {parents
                    .map(parent => parent.name || parent.org_unit_type_name)
                    .join(' > ')}
            </span>
        </Tooltip>
    );
};
