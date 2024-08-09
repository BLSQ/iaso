/* eslint-disable camelcase */
import { Box } from '@mui/material';
import React, { ReactElement } from 'react';
import { makeStyles } from '@mui/styles';
import { textPlaceholder } from 'bluesquare-components';
import { Link } from 'react-router-dom';
import { LinkToForm } from '../../forms/components/LinkToForm';
import { baseUrls } from '../../../constants/urls';
import { LinkToOrgUnit } from '../../orgUnits/components/LinkToOrgUnit';

const useStyles = makeStyles(() => ({
    root: {
        overflowWrap: 'anywhere',
    },
}));

export const OrgUnitsCell = (cellInfo: {
    value?: { count: number; org_units: { id: number; name: string }[] };
}): ReactElement => {
    const { count = 0, org_units } = cellInfo?.value ?? {};
    const classes = useStyles();
    if (count === 0) {
        return <Box>{textPlaceholder}</Box>;
    }
    if (count <= 2) {
        return (
            <Box>
                {org_units?.map((org_unit, index) => {
                    const orgUnitName =
                        index === count - 1
                            ? org_unit.name
                            : `${org_unit.name}, `;
                    return (
                        <LinkToOrgUnit
                            key={org_unit.id}
                            orgUnit={org_unit}
                            name={orgUnitName}
                        />
                    );
                })}
            </Box>
        );
    }
    // If org_units was undefined, count would be 0 and we would already have returned by now
    // @ts-ignore
    const org_unitsString = `${org_units[0].name}, ${org_units[1].name}, ... (${count})`;
    const url = `/${baseUrls.orgUnits}/locationLimit/3000/order/id/pageSize/50/page/1/searchTabIndex/0/searchActive/true/searches/[{"search":"ids:${org_units?.map(org_unit => org_unit.id).join(',')}"}]`;
    return (
        <Box className={classes.root}>
            <Link to={url}>{org_unitsString}</Link>
        </Box>
    );
};
