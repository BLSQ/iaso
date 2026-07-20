import React, { FunctionComponent, useMemo } from 'react';
import { Box, Chip, Typography, alpha } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { textPlaceholder } from 'bluesquare-components';
import DocumentsItemComponent from 'Iaso/components/files/DocumentsItemComponent';
import VideoItemComponent from 'Iaso/components/files/VideoItemComponent';
import { getFileName, getFileType } from 'Iaso/utils/filesUtils';
import { MarkerMap } from '../../../../components/maps/MarkerMapComponent';
import { formatFieldDate } from '../../utils/formatDate';
import { slugifyValue } from '../../utils/questions';
import { InstanceImagePreview } from '../InstanceImagePreview';
import { SubmissionField } from './types';

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

/**
 * Resolve the uploaded file matching a question's value. Mirrors the matching
 * done in InstanceFileContentRich, including the jpg -> webp conversion the
 * backend applies to images.
 */
const useFileUrl = (value: unknown, files: string[]): string | undefined =>
    useMemo(() => {
        if (typeof value !== 'string' || !value || files.length === 0) {
            return undefined;
        }
        const slugified = slugifyValue(value);
        return files.find(f =>
            slugified.endsWith('jpg')
                ? f.includes(slugified) ||
                  f.includes(slugified.replace('.jpg', '.webp'))
                : f.includes(slugified),
        );
    }, [value, files]);

/** ODK stores a geopoint as "latitude longitude altitude accuracy". */
const parseGeoPoint = (
    value: unknown,
): { latitude: number; longitude: number } | undefined => {
    if (typeof value !== 'string') return undefined;
    const [latitude, longitude] = value.trim().split(/\s+/).map(Number);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return undefined;
    return { latitude, longitude };
};

const EmptyValue: FunctionComponent = () => (
    <Typography component="span" sx={{ color: 'text.disabled' }}>
        {textPlaceholder}
    </Typography>
);

const FileValue: FunctionComponent<Props> = ({ field, files }) => {
    const fileUrl = useFileUrl(field.rawValue, files);
    const fileName =
        typeof field.rawValue === 'string'
            ? getFileName(field.rawValue)
            : undefined;
    const fileType = fileName ? getFileType(fileName) : undefined;

    if (!fileUrl || !fileName) return <EmptyValue />;
    if (fileType === 'image') {
        return <InstanceImagePreview imageUrl={fileUrl} altText={field.id} />;
    }
    if (fileType === 'video') {
        return (
            <Box sx={{ height: 200 }}>
                <VideoItemComponent
                    videoPath={fileUrl}
                    fileInfo={fileName.name}
                />
            </Box>
        );
    }
    return (
        <Box sx={{ width: 150 }}>
            <DocumentsItemComponent filePath={fileUrl} />
        </Box>
    );
};

const PhotoValue: FunctionComponent<Props> = ({ field, files }) => {
    const fileUrl = useFileUrl(field.rawValue, files);
    if (!fileUrl) return <EmptyValue />;
    return <InstanceImagePreview imageUrl={fileUrl} altText={field.id} />;
};

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
            return (
                <Box sx={{ maxWidth: 520, width: '100%' }}>
                    <MarkerMap
                        latitude={point.latitude}
                        longitude={point.longitude}
                        mapHeight={190}
                    />
                </Box>
            );
        }
        case 'photo':
            return <PhotoValue field={field} files={files} />;
        case 'file':
            return <FileValue field={field} files={files} />;
        case 'multi':
            return (
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.75,
                        justifyContent: 'inherit',
                    }}
                >
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
                <Typography
                    component="span"
                    sx={{
                        fontFamily: 'monospace',
                        fontSize: 13,
                        color: 'text.secondary',
                        backgroundColor: 'grey.100',
                        borderRadius: 1,
                        px: 1,
                        py: 0.4,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {formatFieldDate(field.rawValue)}
                </Typography>
            );
        case 'number':
            return (
                <Typography
                    component="span"
                    sx={{ fontSize: 18, fontWeight: 500 }}
                >
                    {value}
                </Typography>
            );
        case 'note':
            return (
                <Typography
                    component="span"
                    sx={{ color: 'text.secondary', fontStyle: 'italic' }}
                >
                    {value}
                </Typography>
            );
        default:
            return (
                <Typography component="span" sx={{ fontWeight: 500 }}>
                    {value}
                </Typography>
            );
    }
};
