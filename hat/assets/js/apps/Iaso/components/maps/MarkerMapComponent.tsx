/* eslint-disable react/jsx-props-no-spreading */
import React, {
    FunctionComponent,
    useState,
    useEffect,
    useRef,
    useCallback,
} from 'react';
import { MapContainer, ScaleControl, TileLayer } from 'react-leaflet';
// @ts-ignore
import L from 'leaflet';

import { makeStyles } from '@material-ui/core';
// @ts-ignore
import { commonStyles } from 'bluesquare-components';

// import { ZoomControl } from '../../utils/mapUtils';

import tiles from '../../constants/mapTiles';
import MarkerComponent from './markers/MarkerComponent';
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
    latitude: number | undefined;
    longitude: number | undefined;
};

export const MarkerMap: FunctionComponent<Props> = ({
    latitude,
    longitude,
}) => {
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);

    const map: any = useRef();

    const classes: Record<string, string> = useStyles();

    const boundsOptions = { padding: [500, 500] };

    const fitToBounds = useCallback(() => {
        const latlng = [L.latLng(latitude, longitude)];
        const markerBounds = L.latLngBounds(latlng);

        map.current.leafletElement?.fitBounds(markerBounds, {
            maxZoom: 9,
            padding: boundsOptions.padding,
        });
    }, [boundsOptions.padding, latitude, longitude]);

    useEffect(() => {
        fitToBounds();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!latitude || !longitude) return null;

    return null;
    return (
        <div className={classes.mapContainer}>
            <TilesSwitchDialog
                currentTile={currentTile}
                setCurrentTile={setCurrentTile}
            />
            <MapContainer
                scrollWheelZoom={false}
                maxZoom={currentTile.maxZoom}
                style={{ height: '100%' }}
                center={[0, 0]}
                ref={map}
                zoomControl={false}
                keyboard={false}
                zoomSnap={0.1}
            >
                {/* <ZoomControl fitToBounds={() => fitToBounds()} /> */}

                <ScaleControl imperial={false} />
                <TileLayer
                    attribution={
                        currentTile.attribution ? currentTile.attribution : ''
                    }
                    url={currentTile.url}
                />
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
