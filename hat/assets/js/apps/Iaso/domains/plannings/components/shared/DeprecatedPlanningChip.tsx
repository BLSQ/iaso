import React, { FC } from 'react';
import { Box, Tooltip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { PlanningStatusChip } from './PlanningStatusChip';

export const DeprecatedPlanningChip: FC = () => {
    const { formatMessage } = useSafeIntl();
    return (
        <Tooltip
            title={`${formatMessage(MESSAGES.readOnlyPlanning)} ${formatMessage(MESSAGES.deprecatedPlanningInfos)}`}
        >
            <Box component="span">
                <PlanningStatusChip status="deprecated" />
            </Box>
        </Tooltip>
    );
};
