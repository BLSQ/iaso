import React, { FC } from 'react';
import { Chip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import {
    getStatusColor,
    getTranslatedStatusMessage,
} from 'Iaso/domains/tasks/components/StatusCell';
import { SxStyles } from 'Iaso/types/general';

type Props = {
    status: string;
};

const styles: SxStyles = {
    chip: {
        color: 'white',
    },
};

export const StatusCell: FC<Props> = ({ status }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <span>
            <Chip
                label={getTranslatedStatusMessage(formatMessage, status)}
                color={getStatusColor(status)}
                size="small"
                sx={styles.chip}
            />
        </span>
    );
};
