import React, { FunctionComponent } from 'react';

import { useSafeIntl } from 'bluesquare-components';

import { Box } from '@mui/material';
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

    return <Box>{label}</Box>;
};
