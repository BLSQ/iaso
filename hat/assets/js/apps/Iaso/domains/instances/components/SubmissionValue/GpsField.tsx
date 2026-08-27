import React, { FunctionComponent, useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Button, Collapse } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { MarkerMap } from 'Iaso/components/maps/MarkerMapComponent';
import { SxStyles } from 'Iaso/types/general';
import { GeoPoint } from 'Iaso/utils/map/mapUtils';
import MESSAGES from '../../messages';
import { GpsStat } from './GpsStat';

const styles: SxStyles = {
    root: {
        maxWidth: 520,
        width: '100%',
    },
    button: {
        mt: 1,
        px: 0,
        fontSize: 12.5,
        fontWeight: 500,
        textTransform: 'none',
    },
    icon: {
        transition: 'transform .2s',
    },
    stats: {
        display: 'grid',
        gridTemplateColumns: {
            xs: '1fr 1fr',
            sm: 'repeat(4, minmax(0, 1fr))',
        },
        gap: 1,
        mt: 1,
    },
};

/**
 * A geopoint answer: the map, plus a disclosure that reveals the exact
 * latitude / longitude / altitude / accuracy, matching the design's GpsField.
 */
export const GpsField: FunctionComponent<{ point: GeoPoint }> = ({ point }) => {
    const { formatMessage } = useSafeIntl();
    const [showValues, setShowValues] = useState(false);
    return (
        <Box sx={styles.root}>
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
                            ...styles.icon,
                            transform: showValues ? 'rotate(180deg)' : 'none',
                        }}
                    />
                }
                sx={styles.button}
            >
                {formatMessage(
                    showValues
                        ? MESSAGES.hideExactValues
                        : MESSAGES.showExactValues,
                )}
            </Button>
            <Collapse in={showValues} unmountOnExit>
                <Box sx={styles.stats}>
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
