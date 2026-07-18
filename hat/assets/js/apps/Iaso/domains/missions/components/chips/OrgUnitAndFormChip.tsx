import React, { FunctionComponent } from 'react';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Chip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { missionTypeChipStyles } from './styles';

export const OrgUnitAndFormChip: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();

    return (
        <Chip
            icon={<LocationOnIcon />}
            label={formatMessage(MESSAGES.orgUnitAndFormChip)}
            size="small"
            sx={missionTypeChipStyles.chip}
        />
    );
};
