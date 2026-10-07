import React, { FunctionComponent, ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { textPlaceholder } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';

/** Width of the label column, matching the design's 118px key column. */
export const LABEL_WIDTH = 118;

/**
 * Shared rail type scale, kept deliberately small: 14px for values, 13px for
 * labels, 12px for meta (dates). Weights are limited to 500 (labels) and 600
 * (emphasised values); de-emphasis is done with colour, not extra weights.
 */
const styles: SxStyles = {
    label: {
        fontSize: 13,
        fontWeight: 500,
        lineHeight: 1.35,
        color: 'text.secondary',
    },
    value: {
        fontSize: 14,
        fontWeight: 600,
        color: 'text.primary',
        wordBreak: 'break-word',
        minWidth: 0,
    },
    valueMono: {
        wordBreak: 'break-word',
        minWidth: 0,
        fontWeight: 500,
        fontFamily: 'monospace',
        fontSize: 13,
        color: 'text.secondary',
    },
    row: {
        display: 'grid',
        gridTemplateColumns: `${LABEL_WIDTH}px minmax(0, 1fr)`,
        gap: 1.75,
        alignItems: 'baseline',
        py: 0.9,
    },
    valueMonoDisabled: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: 'text.disabled',
    },
};

type Props = {
    label: string;
    children: ReactNode;
    /** Render the value in a monospace face, for identifiers */
    mono?: boolean;
};

/**
 * A label/value row of the general card: both columns left aligned, muted label,
 * emphasised value. Deliberately not InstanceDetailsField, whose right aligned
 * label and trailing colon the design moves away from.
 */
export const InfoRow: FunctionComponent<Props> = ({
    label,
    children,
    mono = false,
}) => (
    <Box sx={styles.row}>
        <Typography component="span" sx={styles.label}>
            {label}
        </Typography>
        <Typography
            component="span"
            sx={mono ? styles.valueMono : styles.value}
        >
            {children}
        </Typography>
    </Box>
);

/**
 * Activity row: who did it in the emphasised face, when underneath in a quieter
 * monospace face, as a single unit rather than two unrelated rows.
 */
export const ActivityRow: FunctionComponent<{
    label: string;
    who?: ReactNode;
    when?: ReactNode;
}> = ({ label, who, when }) => (
    <Box sx={styles.row}>
        <Typography component="span" sx={styles.label}>
            {label}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {who && (
                <Typography component="span" sx={styles.value}>
                    {who}
                </Typography>
            )}
            {when && (
                <Typography component="span" sx={styles.valueMonoDisabled}>
                    {when}
                </Typography>
            )}
        </Box>
    </Box>
);

/**
 * Right-aligned key / value row, matching the design's `.kv` list used by the
 * location panel: a muted label that wraps (no colon, no ellipsis) and an
 * emphasised value in the second column, with a light separator between rows.
 * The prop shape matches InstanceDetailsField so it can be dropped in as its
 * `FieldComponent`.
 */
export const KvRow: FunctionComponent<{
    label: string;
    value?: ReactNode;
}> = ({ label, value }) => {
    const isEmpty = value === null || value === undefined || value === '';
    return (
        <Box
            sx={{
                ...styles.row,
                gridTemplateColumns: 'minmax(96px, 42%) 1fr',
                borderBottom: 1,
                borderColor: 'divider',
                '&:last-of-type': { borderBottom: 0 },
            }}
        >
            <Typography
                component="span"
                title={label}
                sx={{
                    ...styles.label,
                    textAlign: 'right',
                    wordBreak: 'break-word',
                }}
            >
                {label}
            </Typography>
            <Box
                component="span"
                sx={{
                    ...styles.value,
                    fontWeight: isEmpty ? 500 : 600,
                    color: isEmpty ? 'text.disabled' : 'text.primary',
                }}
            >
                {isEmpty ? textPlaceholder : value}
            </Box>
        </Box>
    );
};
