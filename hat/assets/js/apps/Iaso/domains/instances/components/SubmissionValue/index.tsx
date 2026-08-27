import React, { FunctionComponent } from 'react';
import { Box, Chip, Typography, alpha } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { SxStyles } from 'Iaso/types/general';
import { parseGeoPoint } from 'Iaso/utils/map/mapUtils';
import { formatFieldDate } from '../../utils/formatDate';
import { SubmissionField } from '../SubmissionContent/types';
import { EmptyValue } from './EmptyValue';
import { FileValue } from './FileValue';
import { GpsField } from './GpsField';
import { PhotoValue } from './PhotoValue';

const styles: SxStyles = {
    multi: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.75,
        justifyContent: 'inherit',
    },
    date: {
        fontFamily: 'monospace',
        fontSize: 13,
        color: 'text.secondary',
        backgroundColor: 'grey.100',
        borderRadius: 1,
        px: 1,
        py: 0.4,
        whiteSpace: 'nowrap',
    },
    number: { fontSize: 18, fontWeight: 500 },
    note: { color: 'text.secondary', fontStyle: 'italic' },
    default: { fontWeight: 500 },
};

type Props = {
    field: SubmissionField;
    files: string[];
};

/**
 * Soft tinted pill matching the design's `.val-choice` / `.pill`: a light fill
 * of the primary colour with a subtle border, rather than MUI's harder
 * outlined chip. Alphas mirror the design tokens (--tint 6%, --tint-line 18%).
 */
const tintedChipSx = (fontSize: number) => (theme: Theme) => ({
    height: 24,
    fontSize,
    fontWeight: 500,
    color: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.06),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
    '& .MuiChip-label': { px: 1.25 },
});

export const SubmissionValue: FunctionComponent<Props> = ({ field, files }) => {
    const { kind, value, empty } = field;

    // photo, file and gps carry their own empty state
    if (empty && kind !== 'photo' && kind !== 'file' && kind !== 'gps') {
        return <EmptyValue />;
    }

    switch (kind) {
        case 'gps': {
            const point = parseGeoPoint(field.rawValue);
            if (!point) return <EmptyValue />;
            return <GpsField point={point} />;
        }
        case 'photo':
            return <PhotoValue field={field} files={files} />;
        case 'file':
            return <FileValue field={field} files={files} />;
        case 'multi':
            return (
                <Box sx={styles.multi}>
                    {value
                        .split(/,\s*/)
                        .filter(Boolean)
                        .map(part => (
                            <Chip
                                key={part}
                                label={part}
                                size="small"
                                sx={tintedChipSx(12.5)}
                            />
                        ))}
                </Box>
            );
        case 'choice':
            return <Chip label={value} size="small" sx={tintedChipSx(13)} />;
        case 'date':
            return (
                <Typography component="span" sx={styles.date}>
                    {formatFieldDate(field.rawValue)}
                </Typography>
            );
        case 'number':
            return (
                <Typography component="span" sx={styles.number}>
                    {value}
                </Typography>
            );
        case 'note':
            return (
                <Typography component="span" sx={styles.note}>
                    {value}
                </Typography>
            );
        default:
            return (
                <Typography component="span" sx={styles.default}>
                    {value}
                </Typography>
            );
    }
};
