import React, { FC, ReactNode, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { LngLatBounds, setWorkerUrl } from 'maplibre-gl';
import workerSource from 'maplibre-gl/dist/maplibre-gl-worker.mjs?raw';
import Map, {
    MapProps,
    NavigationControl,
    ScaleControl,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import tiles from 'Iaso/constants/mapTiles';
import { SxStyles } from 'Iaso/types/general';
import { Tile, TilesSwitchControl } from '../tools/TilesSwitchControl';
import { FIT_BOUNDS_PADDING, FitBoundsControl } from './FitBoundsControl';
import { getRasterStyle } from './rasterStyle';

// MapLibre loads its worker from a file next to its script, which webpack doesn't serve:
// run it from the bundled source instead, so it doesn't depend on the public path.
setWorkerUrl(
    URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' })),
);

const styles = {
    container: {
        position: 'relative',
        width: '100%',
        height: '100%',
    },
} satisfies SxStyles;

type Props = Pick<MapProps, 'initialViewState'> & {
    // Fitted when the map is created, and on demand with the fit button.
    bounds?: LngLatBounds;
    children?: ReactNode;
};

export const BaseMap: FC<Props> = ({ initialViewState, bounds, children }) => {
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    const mapStyle = useMemo(() => getRasterStyle(currentTile), [currentTile]);
    return (
        <Box sx={styles.container}>
            <Map
                initialViewState={
                    bounds
                        ? {
                              bounds,
                              fitBoundsOptions: { padding: FIT_BOUNDS_PADDING },
                          }
                        : initialViewState
                }
                mapStyle={mapStyle}
                maxZoom={currentTile.maxZoom}
                scrollZoom={false}
                dragRotate={false}
                attributionControl={{ compact: true }}
            >
                <NavigationControl position="top-left" showCompass={false} />
                {bounds && <FitBoundsControl bounds={bounds} />}
                <ScaleControl position="bottom-left" />
                {children}
            </Map>
            <TilesSwitchControl
                currentTile={currentTile}
                setCurrentTile={setCurrentTile}
            />
        </Box>
    );
};
