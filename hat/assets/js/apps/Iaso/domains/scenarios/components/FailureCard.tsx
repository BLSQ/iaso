import React, { FunctionComponent } from 'react';
import { Paper, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';
import { StatusChip } from './StatusChip';

const styles: SxStyles = {
    card: {
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        alignItems: 'flex-start',
    },
    main: { fontSize: 22, fontWeight: 500, lineHeight: 1.35 },
    detail: {
        whiteSpace: 'pre-line',
        color: 'text.secondary',
        fontFamily: 'monospace',
        fontSize: 13,
    },
};

type Props = {
    status: string;
    step: number | null;
    failures: string[];
    showTechnicalNames: boolean;
};

/** What went wrong, in sentences: the first line of each failure; the rest (the app's evaluation) for support. */
export const FailureCard: FunctionComponent<Props> = ({
    status,
    step,
    failures,
    showTechnicalNames,
}) => {
    const { formatMessage } = useSafeIntl();
    const sentences = failures.map(failure => {
        const [first, ...rest] = failure.replace(/^Step \d+: /, '').split('\n');
        return { first: first.replace(/:$/, ''), rest: rest.join('\n') };
    });
    return (
        <Paper
            sx={styles.card}
            aria-label={formatMessage(MESSAGES.whatWentWrong)}
        >
            <StatusChip status={status} step={step} />
            {sentences.map(({ first, rest }) => (
                <React.Fragment key={first}>
                    <Typography sx={styles.main}>{first}</Typography>
                    {showTechnicalNames && rest && (
                        <Typography sx={styles.detail}>{rest}</Typography>
                    )}
                </React.Fragment>
            ))}
        </Paper>
    );
};
