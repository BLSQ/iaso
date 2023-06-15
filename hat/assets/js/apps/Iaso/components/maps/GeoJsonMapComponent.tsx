import React, { FunctionComponent, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, ScaleControl, GeoJSON } from 'react-leaflet';

import { makeStyles, useTheme } from '@material-ui/core';
import { commonStyles } from 'bluesquare-components';

import tiles from '../../constants/mapTiles';

import { GeoJson } from './types';
import { Tile } from './tools/TilesSwitchControl';
import { CustomZoomControl } from './tools/CustomZoomControl';
import { CustomTileLayer } from './tools/CustomTileLayer';
import { Bounds } from '../../utils/map/mapUtils';

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
    geoJson: GeoJson;
};

export const GeoJsonMap: FunctionComponent<Props> = ({ geoJson }) => {
    const classes: Record<string, string> = useStyles();
    const theme = useTheme();
    const bounds: Bounds | undefined = useMemo(() => {
        const shape = L.geoJSON(geoJson);
        return shape?.getBounds();
    }, [geoJson]);
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    const boundsOptions: Record<string, any> = {
        padding: [10, 10],
        maxZoom: currentTile.maxZoom,
    };

    return (
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
                    // @ts-ignore TODO: fix this type problem
                    style={{
                        color: theme.palette.secondary.main,
                    }}
                    data={geoJson}
                />
            </MapContainer>
        </div>
    );
};
