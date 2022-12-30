import React, { FunctionComponent, useRef } from 'react';
import { Map, TileLayer, Polygon, ScaleControl } from 'react-leaflet';

import { makeStyles } from '@material-ui/core';
// @ts-ignore
import { commonStyles } from 'bluesquare-components';
import { getLatLngBounds, ZoomControl } from '../../utils/mapUtils';

import tiles from '../../constants/mapTiles';

const useStyles = makeStyles(theme => ({
    mapContainer: {
        ...commonStyles(theme).mapContainer,
        height: 400,
        minWidth: 200,
        marginbottom: 0,
    },
}));

type Props = {
    polygonPositions: Array<any>;
};

export const PolygonMap: FunctionComponent<Props> = ({ polygonPositions }) => {
    const map: any = useRef();

    const classes: Record<string, string> = useStyles();

    const currentTile = tiles.osm;
    const boundsOptions = { padding: [10, 10] };

    const fitToBounds = () => {
        const bounds = getLatLngBounds(polygonPositions);

        map.current.leafletElement.fitBounds(bounds, {
            maxZoom: tiles.osm.maxZoom,
            padding: boundsOptions.padding,
        });
    };

    return (
        <div className={classes.mapContainer}>
            <Map
                scrollWheelZoom={false}
                maxZoom={currentTile.maxZoom}
                style={{ height: '100%' }}
                center={[0, 0]}
                bounds={getLatLngBounds(polygonPositions)}
                boundsOptions={boundsOptions}
                ref={map}
                zoomControl={false}
                keyboard={false}
            >
                <ZoomControl fitToBounds={() => fitToBounds()} />
                <ScaleControl imperial={false} />
                <TileLayer
                    attribution={
                        currentTile.attribution ? currentTile.attribution : ''
                    }
                    url={currentTile.url}
                />
                <Polygon positions={polygonPositions} color="blue" />
            </Map>
        </div>
    );
};
