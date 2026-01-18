import React, { FunctionComponent } from 'react';
import { Chip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

type Props = {
    status: 'draft' | 'published';
};

export const PlanningStatusChip: FunctionComponent<Props> = ({ status }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Chip
            label={
                status === 'published'
                    ? formatMessage(MESSAGES.published)
                    : formatMessage(MESSAGES.draft)
            }
            size="small"
            sx={{
                backgroundColor: theme =>
                    status === 'published'
                        ? theme.palette.success.main
                        : theme.palette.error.main,
                color: 'white',
                fontSize: '0.8rem',
            }}
        />
    );
};
