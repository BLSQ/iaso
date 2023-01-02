import React, { FunctionComponent, useRef, useMemo } from 'react';
import { wktToGeoJSON } from '@terraformer/wkt';
// @ts-ignore
import L from 'leaflet';
import { Map, TileLayer, ScaleControl, GeoJSON } from 'react-leaflet';

import { makeStyles } from '@material-ui/core';
// @ts-ignore
import { commonStyles } from 'bluesquare-components';
import { ZoomControl } from '../../utils/mapUtils';

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
    polygonPositions: string;
};

export const PolygonMap: FunctionComponent<Props> = ({ polygonPositions }) => {
    const map: any = useRef();

    const classes: Record<string, string> = useStyles();

    const geoJson = useMemo(() => {
        return wktToGeoJSON(polygonPositions.replace('SRID=4326;', ''));
    }, [polygonPositions]);
    const bounds = useMemo(() => {
        const shape = L.geoJSON(geoJson);
        return shape?.getBounds();
    }, [geoJson]);

    const currentTile = tiles.osm;
    const boundsOptions = { padding: [10, 10] };

    const fitToBounds = () => {
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
                bounds={bounds}
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
                <GeoJSON
                    data={geoJson}
                    style={() => ({
                        color: 'blue',
                    })}
                />
            </Map>
        </div>
    );
};
