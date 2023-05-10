import React, { FunctionComponent, useRef, useMemo, useState } from 'react';
// @ts-ignore
import L from 'leaflet';
import { Map, TileLayer, ScaleControl, GeoJSON } from 'react-leaflet';

import { makeStyles } from '@material-ui/core';
// @ts-ignore
import { commonStyles } from 'bluesquare-components';
import { ZoomControl } from '../../utils/mapUtils';

import tiles from '../../constants/mapTiles';

import { GeoJson } from './types';
import { TilesSwitchDialog, Tile } from './tools/TilesSwitchDialog';

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
    const map: any = useRef();

    const classes: Record<string, string> = useStyles();

    const bounds = useMemo(() => {
        const shape = L.geoJSON(geoJson);
        return shape?.getBounds();
    }, [geoJson]);
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    const boundsOptions = { padding: [10, 10] };

    const fitToBounds = () => {
        map.current.leafletElement.fitBounds(bounds, {
            maxZoom: tiles.osm.maxZoom,
            padding: boundsOptions.padding,
        });
    };
    return null;
    return (
        <div className={classes.mapContainer}>
            <TilesSwitchDialog
                currentTile={currentTile}
                setCurrentTile={setCurrentTile}
            />
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
                {/* <ZoomControl fitToBounds={() => fitToBounds()} /> */}
                <ScaleControl imperial={false} />
                <TileLayer
                    attribution={
                        currentTile.attribution ? currentTile.attribution : ''
                    }
                    url={currentTile.url}
                />

                <GeoJSON className="secondary" data={geoJson} />
            </Map>
        </div>
    );
};
