import React, {
    FunctionComponent,
    useMemo,
    useState,
    useRef,
    useEffect,
} from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, ScaleControl, GeoJSON } from 'react-leaflet';

import { makeStyles, useTheme } from '@material-ui/core';
import { commonStyles } from 'bluesquare-components';

import tiles from '../../constants/mapTiles';

import { GeoJson } from './types';
import { TilesSwitchDialog, Tile } from './tools/TilesSwitchDialog';
import { CustomZoomControl } from './CustomZoomControl';
import { CustomTileLayer } from './CustomTileLayer';

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
    const bounds = useMemo(() => {
        const shape = L.geoJSON(geoJson);
        return shape?.getBounds();
    }, [geoJson]);
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    const boundsOptions = { padding: [10, 10] };

    const ref: any = useRef(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.setUrl(currentTile.url);
        }
    }, [currentTile]);
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
                bounds={bounds}
                boundsOptions={boundsOptions}
                zoomControl={false}
                keyboard={false}
            >
                <CustomZoomControl
                    bounds={bounds}
                    boundsOptions={{
                        padding: [10, 10],
                        maxZoom: currentTile.maxZoom,
                    }}
                />
                <ScaleControl imperial={false} />
                <CustomTileLayer currentTile={currentTile} />

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
