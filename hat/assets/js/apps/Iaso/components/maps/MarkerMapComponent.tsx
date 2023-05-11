/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent, useState, useMemo } from 'react';
import { MapContainer, ScaleControl } from 'react-leaflet';
import L from 'leaflet';

import { makeStyles } from '@material-ui/core';
import { commonStyles } from 'bluesquare-components';

import { CustomTileLayer } from './CustomTileLayer';

import tiles from '../../constants/mapTiles';
import MarkerComponent from './markers/MarkerComponent';
import { TilesSwitchDialog, Tile } from './tools/TilesSwitchDialog';
import { CustomZoomControl } from './CustomZoomControl';

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
};

export const MarkerMap: FunctionComponent<Props> = ({
    latitude,
    longitude,
}) => {
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);

    const classes: Record<string, string> = useStyles();

    const boundsOptions: Record<string, any> = {
        padding: [500, 500],
        maxZoom: currentTile.maxZoom,
    };

    const bounds = useMemo(() => {
        const latlng = [L.latLng(latitude, longitude)];
        return L.latLngBounds(latlng);
    }, [latitude, longitude]);

    if (!latitude || !longitude) return null;
    return (
        <div className={classes.mapContainer}>
            <TilesSwitchDialog
                currentTile={currentTile}
                setCurrentTile={setCurrentTile}
            />
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
                <CustomTileLayer currentTile={currentTile} />
                <MarkerComponent
                    item={{
                        latitude,
                        longitude,
                    }}
                />
            </MapContainer>
        </div>
    );
};
