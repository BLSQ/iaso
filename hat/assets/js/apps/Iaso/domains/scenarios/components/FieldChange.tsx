import React, { FunctionComponent, ReactNode } from 'react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Box } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';

const styles: SxStyles = {
    field: { display: 'flex', flexDirection: 'column', fontSize: 14 },
    label: { fontSize: 12, color: 'text.secondary' },
    values: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        columnGap: 0.5,
        // long codes and values break anywhere rather than overflow a narrow column
        overflowWrap: 'anywhere',
    },
    before: { color: 'text.secondary' },
    arrow: { fontSize: 14, color: 'text.secondary' },
    after: { fontWeight: 600, color: 'primary.main' },
};

type Props = {
    label: ReactNode;
    before: string;
    // a value different from `before`; none: unchanged
    after?: string;
};

/** A field of the entity's information, in a narrow column: its label, then its value, or `before → after`. */
export const FieldChange: FunctionComponent<Props> = ({
    label,
    before,
    after,
}) => (
    <Box sx={styles.field}>
        <Box sx={styles.label}>{label}</Box>
        <Box sx={styles.values}>
            {after === undefined ? (
                <span>{before}</span>
            ) : (
                <>
                    <Box component="span" sx={styles.before}>
                        {before}
                    </Box>
                    <ArrowForwardIcon sx={styles.arrow} aria-label="→" />
                    <Box component="span" sx={styles.after}>
                        {after}
                    </Box>
                </>
            )}
        </Box>
    </Box>
);
