import React, { FunctionComponent } from 'react';
import { Chip } from '@mui/material';
import { IntlMessage, useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';

const styles: SxStyles = {
    passed: { backgroundColor: 'success.light', color: 'success.contrastText' },
    failed: { backgroundColor: 'error.light', color: 'error.contrastText' },
    error: { backgroundColor: 'warning.light', color: 'warning.contrastText' },
    neutral: {},
};

// scenario statuses, and step statuses (ok, refused, not_offered...)
const LOOKS: Record<string, { message: IntlMessage; sx: keyof typeof styles }> =
    {
        passed: { message: MESSAGES.passed, sx: 'passed' },
        ok: { message: MESSAGES.passed, sx: 'passed' },
        failed: { message: MESSAGES.failed, sx: 'failed' },
        refused: { message: MESSAGES.refused, sx: 'failed' },
        not_offered: { message: MESSAGES.notOffered, sx: 'failed' },
        error: { message: MESSAGES.error, sx: 'error' },
    };

type Props = {
    status?: string;
    // "Failed at step 2"
    step?: number | null;
};

export const StatusChip: FunctionComponent<Props> = ({ status, step }) => {
    const { formatMessage } = useSafeIntl();
    const look = status ? LOOKS[status] : undefined;
    if (!look) {
        return <Chip size="small" label={formatMessage(MESSAGES.notRun)} />;
    }
    const atStep =
        step && status !== 'passed'
            ? ` ${formatMessage(MESSAGES.atStep, { step: String(step) })}`
            : '';
    return (
        <Chip
            size="small"
            sx={styles[look.sx]}
            label={`${formatMessage(look.message)}${atStep}`}
        />
    );
};
