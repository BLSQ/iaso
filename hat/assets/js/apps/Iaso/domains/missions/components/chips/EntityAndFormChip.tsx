import React, { FunctionComponent } from 'react';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { Chip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { missionTypeChipStyles } from './styles';

export const EntityAndFormChip: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();

    return (
        <Chip
            icon={<AssignmentIndIcon />}
            label={formatMessage(MESSAGES.entityAndFormChip)}
            size="small"
            sx={missionTypeChipStyles.chip}
        />
    );
};
