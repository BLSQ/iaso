import React, { FunctionComponent } from 'react';
import { Box, Typography } from '@mui/material';
import { IntlMessage, useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { displayValue } from '../utils';

const styles: SxStyles = {
    section: { display: 'flex', flexDirection: 'column', gap: 0.75 },
    title: {
        fontSize: 12,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '.04em',
        color: 'text.secondary',
    },
    values: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: '4px 8px',
        fontSize: 14,
        wordBreak: 'break-word',
    },
    name: { color: 'text.secondary' },
};

type Props = {
    title: IntlMessage;
    values: Record<string, unknown>;
    label: (name: string) => string;
};

/** Question -> value, for people: labels and values as on the phone; nothing when empty. */
export const LabeledValues: FunctionComponent<Props> = ({
    title,
    values,
    label,
}) => {
    const { formatMessage } = useSafeIntl();
    const entries = Object.entries(values);
    if (entries.length === 0) {
        return null;
    }
    return (
        <Box sx={styles.section}>
            <Typography sx={styles.title}>{formatMessage(title)}</Typography>
            <Box sx={styles.values}>
                {entries.map(([name, value]) => (
                    <React.Fragment key={name}>
                        <Box sx={styles.name}>{label(name)}</Box>
                        <Box>{displayValue(value)}</Box>
                    </React.Fragment>
                ))}
            </Box>
        </Box>
    );
};
