import React, { FunctionComponent, ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { textPlaceholder } from 'bluesquare-components';
import { SxStyles } from '../../../../types/general';

// values are cut (full text in the tooltip) so the cards keep their height
// when moving from a question to the next
const styles: SxStyles = {
    root: {
        minWidth: 0,
    },
    value: {
        fontWeight: 'medium',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    largeValue: {
        fontWeight: 'bold',
        lineHeight: 1.3,
        minHeight: '2.6em',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        wordBreak: 'break-word',
    },
    dhis2Id: {
        fontFamily: 'monospace',
        color: 'text.secondary',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
};

type Props = {
    label: string;
    value?: ReactNode;
    // DHIS2 id shown under the value
    dhis2Id?: string;
    // keep the id line even without id, to align with mapped questions
    reserveIdLine?: boolean;
    // bold, on two lines
    large?: boolean;
};

export const LabeledValue: FunctionComponent<Props> = ({
    label,
    value,
    dhis2Id,
    reserveIdLine = false,
    large = false,
}) => (
    <Box role="group" aria-label={label} sx={styles.root}>
        <Typography variant="caption" color="textSecondary" component="div">
            {label}
        </Typography>
        <Typography
            variant={large ? 'h6' : 'body1'}
            component="div"
            sx={large ? styles.largeValue : styles.value}
            title={typeof value === 'string' ? value : undefined}
        >
            {value === undefined || value === null || value === ''
                ? textPlaceholder
                : value}
        </Typography>
        {(dhis2Id || reserveIdLine) && (
            <Typography variant="caption" component="div" sx={styles.dhis2Id}>
                {dhis2Id ?? ' '}
            </Typography>
        )}
    </Box>
);
