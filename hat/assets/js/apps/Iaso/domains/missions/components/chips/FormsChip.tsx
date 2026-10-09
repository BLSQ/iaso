import React, { FunctionComponent } from 'react';
import DescriptionIcon from '@mui/icons-material/Description';
import { Chip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { missionTypeChipStyles } from './styles';

export const FormsChip: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();

    return (
        <Chip
            icon={<DescriptionIcon />}
            label={formatMessage(MESSAGES.form)}
            size="small"
            sx={missionTypeChipStyles.chip}
        />
    );
};
