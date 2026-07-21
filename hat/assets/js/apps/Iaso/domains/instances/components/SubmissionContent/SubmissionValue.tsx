import React, { FunctionComponent, useMemo } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Button, Chip, Collapse, Typography, alpha } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import DocumentsItemComponent from 'Iaso/components/files/DocumentsItemComponent';
import VideoItemComponent from 'Iaso/components/files/VideoItemComponent';
import { getFileName, getFileType } from 'Iaso/utils/filesUtils';
import { MarkerMap } from '../../../../components/maps/MarkerMapComponent';
import MESSAGES from '../../messages';
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

type GeoPoint = {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
};

/** ODK stores a geopoint as "latitude longitude altitude accuracy". */
const parseGeoPoint = (value: unknown): GeoPoint | undefined => {
    if (typeof value !== 'string') return undefined;
    const [latitude, longitude, altitude, accuracy] = value
        .trim()
        .split(/\s+/)
        .map(Number);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return undefined;
    return {
        latitude,
        longitude,
        altitude: Number.isNaN(altitude) ? undefined : altitude,
        accuracy: Number.isNaN(accuracy) ? undefined : accuracy,
    };
};

const GpsStat: FunctionComponent<{ label: string; value: string }> = ({
    label,
    value,
}) => (
    <Box
        sx={{
            backgroundColor: 'grey.100',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            px: 1.4,
            py: 0.9,
            display: 'flex',
            flexDirection: 'column',
            gap: '1px',
            minWidth: 0,
        }}
    >
        <Typography
            component="span"
            sx={{
                fontSize: 10.5,
                fontWeight: 500,
                color: 'text.disabled',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
            }}
        >
            {label}
        </Typography>
        <Typography
            component="span"
            sx={{
                fontFamily: 'monospace',
                fontSize: 13,
                fontWeight: 500,
                color: 'text.primary',
                wordBreak: 'break-all',
            }}
        >
            {value}
        </Typography>
    </Box>
);

/**
 * A geopoint answer: the map, plus a disclosure that reveals the exact
 * latitude / longitude / altitude / accuracy, matching the design's GpsField.
 */
const GpsField: FunctionComponent<{ point: GeoPoint }> = ({ point }) => {
    const { formatMessage } = useSafeIntl();
    const [showValues, setShowValues] = React.useState(false);
    return (
        <Box sx={{ maxWidth: 520, width: '100%' }}>
            <MarkerMap
                latitude={point.latitude}
                longitude={point.longitude}
                mapHeight={190}
            />
            <Button
                size="small"
                onClick={() => setShowValues(current => !current)}
                startIcon={
                    <ExpandMoreIcon
                        sx={{
                            transition: 'transform .2s',
                            transform: showValues ? 'rotate(180deg)' : 'none',
                        }}
                    />
                }
                sx={{
                    mt: 1,
                    px: 0,
                    fontSize: 12.5,
                    fontWeight: 500,
                    textTransform: 'none',
                }}
            >
                {formatMessage(
                    showValues
                        ? MESSAGES.hideExactValues
                        : MESSAGES.showExactValues,
                )}
            </Button>
            <Collapse in={showValues} unmountOnExit>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr 1fr',
                            sm: 'repeat(4, minmax(0, 1fr))',
                        },
                        gap: 1,
                        mt: 1,
                    }}
                >
                    <GpsStat
                        label={formatMessage(MESSAGES.latitude)}
                        value={String(point.latitude)}
                    />
                    <GpsStat
                        label={formatMessage(MESSAGES.longitude)}
                        value={String(point.longitude)}
                    />
                    {point.altitude != null && (
                        <GpsStat
                            label={formatMessage(MESSAGES.altitude)}
                            value={`${point.altitude} m`}
                        />
                    )}
                    {point.accuracy != null && (
                        <GpsStat
                            label={formatMessage(MESSAGES.accuracy)}
                            value={`±${point.accuracy} m`}
                        />
                    )}
                </Box>
            </Collapse>
        </Box>
    );
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
        return <PreviewImage url={fileUrl} alt={field.id} />;
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

/**
 * Left-aligned, width-capped wrapper for the shared image preview. Caps the
 * image at the design's 340px (InstanceImagePreview itself is 35vw, which is
 * too wide on large screens and overflows a two-column cell) and pins it to the
 * start of the value column so it lines up under its label.
 */
const PreviewImage: FunctionComponent<{ url: string; alt: string }> = ({
    url,
    alt,
}) => (
    <Box
        sx={{
            width: '100%',
            maxWidth: 340,
            alignSelf: 'flex-start',
            // InstanceImagePreview draws the image with object-fit: contain, so
            // a portrait photo capped by max-height gets centered (and letter-
            // boxed) inside its wider box; pin it to the left so it lines up
            // flush under the label with no phantom left margin.
            '& img': { objectPosition: 'left center' },
        }}
    >
        <InstanceImagePreview imageUrl={url} altText={alt} />
    </Box>
);

const PhotoValue: FunctionComponent<Props> = ({ field, files }) => {
    const fileUrl = useFileUrl(field.rawValue, files);
    if (!fileUrl) return <EmptyValue />;
    return <PreviewImage url={fileUrl} alt={field.id} />;
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
            return <GpsField point={point} />;
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
