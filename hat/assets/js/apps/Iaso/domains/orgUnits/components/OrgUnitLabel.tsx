import React, { FunctionComponent } from 'react';

import { Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';

import { OrgUnit } from '../types/orgUnit';
import { orgUnitLabelString } from '../utils';

export const OrgUnitLabel: FunctionComponent<{
    orgUnit: OrgUnit;
    withType?: boolean;
    withSource?: boolean;
}> = ({ orgUnit, withType = false, withSource = false }) => {
    const intl = useSafeIntl();
    const label = orgUnitLabelString(
        orgUnit,
        withType,
        intl.formatMessage,
        withSource,
    );

    return <Box component="span">{label}</Box>;
};
