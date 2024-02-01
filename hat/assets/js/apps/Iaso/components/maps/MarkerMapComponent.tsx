/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent, useState, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import {
    GeoJSON,
    MapContainer,
    ScaleControl,
    Tooltip,
    Pane,
} from 'react-leaflet';
import L from 'leaflet';
import { pink } from '@mui/material/colors';
import { commonStyles, useSafeIntl } from 'bluesquare-components';

import { Box, Alert, SxProps, Theme } from '@mui/material';
import { CustomTileLayer } from './tools/CustomTileLayer';

import tiles from '../../constants/mapTiles';
import MarkerComponent from './markers/MarkerComponent';
import { Tile } from './tools/TilesSwitchControl';
import { CustomZoomControl } from './tools/CustomZoomControl';
import { ShortOrgUnit } from '../../domains/orgUnits/types/orgUnit';
import MESSAGES from './messages';
import { useMarkerWithinBounds } from './hooks/useMarkerWithinBounds';

const useStyles = () => {
    const theme = useTheme();
    return {
        mapContainer: {
            ...(commonStyles(theme).mapContainer as Record<
                string,
                SxProps<Theme>
            >),
            height: 400,
            minWidth: 200,
            marginBottom: 0,
            position: 'relative',
        },
        alertContainer: {
            zIndex: 402,
            position: 'absolute',
            top: 10,
            left: 50,
            maxWidth: 'calc(100% - 90px)',
        },
        alert: { padding: '0 6px', fontSize: 12, '& svg': { fontSize: 17 } },
    };
};

type Props = {
    latitude: number | undefined;
    longitude: number | undefined;
    maxZoom?: number;
    mapHeight?: number;
    parent?: ShortOrgUnit;
};

export const MarkerMap: FunctionComponent<Props> = ({
    latitude,
    longitude,
    maxZoom,
    mapHeight = 400,
    parent,
}) => {
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    const { formatMessage } = useSafeIntl();

    const styles: Record<string, SxProps<Theme>> = useStyles();

    const boundsOptions: Record<string, [number, number] | number> = {
        padding: [50, 50],
        maxZoom: maxZoom || currentTile.maxZoom,
    };

    const bounds = useMemo(() => {
        let newBounds = L.latLngBounds([L.latLng(latitude, longitude)]);
        if (parent?.geo_json) {
            const parentBounds = L.geoJSON(parent.geo_json).getBounds();
            newBounds = newBounds.isValid()
                ? newBounds.extend(parentBounds)
                : parentBounds;
        }
        return newBounds;
    }, [latitude, longitude, parent?.geo_json]);

    const isMarkerInside = useMarkerWithinBounds(
        latitude,
        longitude,
        parent?.geo_json,
    );
    if (latitude === undefined || longitude === undefined) return null;
    return (
        <Box sx={styles.mapContainer} height={mapHeight}>
            {!isMarkerInside && (
                <Box sx={styles.alertContainer}>
                    <Alert severity="warning" sx={styles.alert}>
                        {formatMessage(MESSAGES.locationNotInShape)}
                    </Alert>
                </Box>
            )}
            <MapContainer
                doubleClickZoom={false}
                scrollWheelZoom={false}
                maxZoom={currentTile.maxZoom}
                style={{ height: '100%', width: '100%' }}
                center={[0, 0]}
                zoomControl={false}
                keyboard={false}
                bounds={bounds}
                boundsOptions={boundsOptions}
            >
                <CustomZoomControl
                    bounds={bounds}
                    boundsOptions={boundsOptions}
                />
                <ScaleControl imperial={false} />
                <CustomTileLayer
                    currentTile={currentTile}
                    setCurrentTile={setCurrentTile}
                />
                {parent?.geo_json && (
                    <Pane name="parent">
                        <GeoJSON
                            data={parent.geo_json}
                            pathOptions={{
                                color: pink['300'],
                            }}
                        >
                            <Tooltip sticky pane="popupPane">
                                {formatMessage(MESSAGES.parent)}: {parent.name}
                            </Tooltip>
                        </GeoJSON>
                    </Pane>
                )}
                <Pane name="location">
                    <MarkerComponent
                        item={{
                            latitude,
                            longitude,
                        }}
                        markerProps={() => ({
                            fillColor: 'red',
                        })}
                    />
                </Pane>
            </MapContainer>
        </Box>
    );
};
