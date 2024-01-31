/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent, useState, useMemo } from 'react';
import { GeoJSON, MapContainer, ScaleControl } from 'react-leaflet';
import L from 'leaflet';

import { makeStyles } from '@mui/styles';
import { pink } from '@mui/material/colors';
import { commonStyles } from 'bluesquare-components';

import { Box } from '@mui/material';
import { CustomTileLayer } from './tools/CustomTileLayer';

import tiles from '../../constants/mapTiles';
import MarkerComponent from './markers/MarkerComponent';
import { Tile } from './tools/TilesSwitchControl';
import { CustomZoomControl } from './tools/CustomZoomControl';
import { GeoJson } from './types';

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
    parentGeoJson?: GeoJson;
};

export const MarkerMap: FunctionComponent<Props> = ({
    latitude,
    longitude,
    maxZoom,
    mapHeight = 400,
    parentGeoJson,
}) => {
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);

    const classes: Record<string, string> = useStyles();

    const boundsOptions: Record<string, [number, number] | number> = {
        padding: [50, 50],
        maxZoom: maxZoom || currentTile.maxZoom,
    };

    const bounds = useMemo(() => {
        let newBounds = L.latLngBounds([L.latLng(latitude, longitude)]);
        if (parentGeoJson) {
            const parentBounds = L.geoJSON(parentGeoJson).getBounds();
            newBounds = newBounds.isValid()
                ? newBounds.extend(parentBounds)
                : parentBounds;
        }
        return newBounds;
    }, [latitude, longitude, parentGeoJson]);

    if (latitude === undefined || longitude === undefined) return null;
    return (
        <Box className={classes.mapContainer} height={mapHeight}>
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
                <MarkerComponent
                    item={{
                        latitude,
                        longitude,
                    }}
                    markerProps={() => ({
                        fillColor: 'red',
                    })}
                />
                {parentGeoJson && (
                    <GeoJSON
                        data={parentGeoJson}
                        pathOptions={{
                            color: pink['300'],
                        }}
                    />
                )}
            </MapContainer>
        </Box>
    );
};
