/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent, useState, useMemo } from 'react';
import { MapContainer, ScaleControl } from 'react-leaflet';
import L from 'leaflet';

import { makeStyles } from '@mui/styles';
import { commonStyles } from 'bluesquare-components';

import { Box } from '@mui/material';
import { CustomTileLayer } from './tools/CustomTileLayer';

import tiles from '../../constants/mapTiles';
import MarkerComponent from './markers/MarkerComponent';
import { Tile } from './tools/TilesSwitchControl';
import { CustomZoomControl } from './tools/CustomZoomControl';

const useStyles = makeStyles(theme => ({
    mapContainer: {
        ...commonStyles(theme).mapContainer,
        height: 400,
        minWidth: 200,
        marginBottom: 0,
        position: 'relative',
    },
}));

type Props = {
    latitude: number | undefined;
    longitude: number | undefined;
    maxZoom?: number;
    mapHeight?: number;
};

export const MarkerMap: FunctionComponent<Props> = ({
    latitude,
    longitude,
    maxZoom,
    mapHeight = 400,
}) => {
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);

    const classes: Record<string, string> = useStyles();

    const boundsOptions: Record<string, [number, number] | number> = {
        padding: [500, 500],
        maxZoom: maxZoom || currentTile.maxZoom,
    };

    const bounds = useMemo(() => {
        const latlng = [L.latLng(latitude, longitude)];
        return L.latLngBounds(latlng);
    }, [latitude, longitude]);

    if (!latitude || !longitude) return null;
    return (
        <Box className={classes.mapContainer} height={mapHeight}>
            <MapContainer
                doubleClickZoom={false}
                scrollWheelZoom={false}
                maxZoom={currentTile.maxZoom}
                style={{ height: '100%' }}
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
                <MarkerComponent
                    item={{
                        latitude,
                        longitude,
                    }}
                    markerProps={() => ({
                        fillColor: 'red',
                    })}
                />
            </MapContainer>
        </Box>
    );
};
