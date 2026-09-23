import React, { FunctionComponent, useMemo, useState } from 'react';

import { Box, Typography, useTheme } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { commonStyles } from 'bluesquare-components';
import L from 'leaflet';
import { MapContainer, ScaleControl, GeoJSON } from 'react-leaflet';

import tiles from '../../constants/mapTiles';

import { Bounds, CloseTooltipOnMoveStart } from '../../utils/map/mapUtils';
import { CustomTileLayer } from './tools/CustomTileLayer';
import { CustomZoomControl } from './tools/CustomZoomControl';
import { Tile } from './tools/TilesSwitchControl';
import { GeoJson } from './types';

const useStyles = makeStyles(theme => ({
    mapContainer: {
        ...commonStyles(theme).mapContainer,
        height: 400,
        minWidth: 200,
        marginBottom: 0,
        position: 'relative',
    },
    legendSwatch: {
        width: 16,
        height: 4,
        borderRadius: 1,
    },
    legendSwatchOld: {
        backgroundColor: theme.palette.error.main,
    },
    legendSwatchNew: {
        backgroundColor: theme.palette.success.main,
    },
}));

type Props = {
    newGeoJson: GeoJson;
    oldGeoJson: GeoJson;
    newLabel?: string;
    oldLabel?: string;
};

export const CompareGeoJsonMap: FunctionComponent<Props> = ({
    newGeoJson,
    oldGeoJson,
    newLabel,
    oldLabel,
}) => {
    //@ts-ignore
    const classes: Record<string, string> = useStyles();
    const theme = useTheme();
    const bounds: Bounds | undefined = useMemo(() => {
        return L.geoJSON({ type: 'FeatureCollection', features: [] } as any)
            .addData(newGeoJson as any)
            .addData(oldGeoJson as any)
            .getBounds();
    }, [newGeoJson, oldGeoJson]);
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    const boundsOptions: Record<string, any> = {
        padding: [10, 10],
        maxZoom: currentTile.maxZoom,
    };

    return (
        <>
            {(oldLabel || newLabel) && (
                <Box display="flex" gap={2} mb={0.5}>
                    {oldLabel && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <Box
                                className={`${classes.legendSwatch} ${classes.legendSwatchOld}`}
                            />
                            <Typography variant="caption">
                                {oldLabel}
                            </Typography>
                        </Box>
                    )}
                    {newLabel && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <Box
                                className={`${classes.legendSwatch} ${classes.legendSwatchNew}`}
                            />
                            <Typography variant="caption">
                                {newLabel}
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}
            <div className={classes.mapContainer}>
                <MapContainer
                    doubleClickZoom
                    scrollWheelZoom={false}
                    maxZoom={currentTile.maxZoom}
                    style={{ height: '100%' }}
                    center={[0, 0]}
                    bounds={bounds}
                    boundsOptions={boundsOptions}
                    zoomControl={false}
                    keyboard={false}
                >
                    <CloseTooltipOnMoveStart />
                    <CustomZoomControl
                        bounds={bounds}
                        boundsOptions={boundsOptions}
                    />
                    <ScaleControl imperial={false} />
                    <CustomTileLayer
                        currentTile={currentTile}
                        setCurrentTile={setCurrentTile}
                    />
                    <GeoJSON
                        key="old"
                        style={{ color: theme.palette.error.main }}
                        data={oldGeoJson}
                    />
                    <GeoJSON
                        key="new"
                        style={{ color: theme.palette.success.main }}
                        data={newGeoJson}
                    />
                </MapContainer>
            </div>
        </>
    );
};
