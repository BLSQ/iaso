import React, { FunctionComponent, ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

/** Width of the label column, matching the design's 118px key column. */
const LABEL_WIDTH = 118;

type Props = {
    label: string;
    children: ReactNode;
    /** Slightly smaller label, used inside the technical details disclosure */
    dense?: boolean;
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
    dense = false,
    mono = false,
}) => (
    <Box
        sx={{
            display: 'grid',
            gridTemplateColumns: `${LABEL_WIDTH}px minmax(0, 1fr)`,
            gap: 1.75,
            alignItems: 'baseline',
            py: 0.9,
        }}
    >
        <Typography
            component="span"
            sx={{
                fontSize: dense ? 12.5 : 13,
                fontWeight: 500,
                lineHeight: 1.35,
                color: 'text.secondary',
            }}
        >
            {label}
        </Typography>
        <Typography
            component="span"
            sx={{
                fontSize: mono ? 13 : 13.5,
                fontWeight: mono ? 500 : 600,
                fontFamily: mono ? 'monospace' : undefined,
                color: mono ? 'text.secondary' : 'text.primary',
                wordBreak: 'break-word',
                minWidth: 0,
            }}
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
    dense?: boolean;
}> = ({ label, who, when, dense = false }) => (
    <Box
        sx={{
            display: 'grid',
            gridTemplateColumns: `${LABEL_WIDTH}px minmax(0, 1fr)`,
            gap: 1.75,
            alignItems: 'baseline',
            py: 0.9,
        }}
    >
        <Typography
            component="span"
            sx={{
                fontSize: dense ? 12.5 : 13,
                fontWeight: 500,
                lineHeight: 1.35,
                color: 'text.secondary',
            }}
        >
            {label}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {who && (
                <Typography
                    component="span"
                    sx={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        wordBreak: 'break-word',
                    }}
                >
                    {who}
                </Typography>
            )}
            {when && (
                <Typography
                    component="span"
                    sx={{
                        fontFamily: 'monospace',
                        fontSize: 12,
                        color: 'text.disabled',
                    }}
                >
                    {when}
                </Typography>
            )}
        </Box>
    </Box>
);
