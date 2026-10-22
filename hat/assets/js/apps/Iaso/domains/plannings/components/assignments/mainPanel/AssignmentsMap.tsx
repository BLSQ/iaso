import React, { FC, useState } from 'react';
import { Box } from '@mui/material';
import { MapContainer, ScaleControl } from 'react-leaflet';
import { CustomTileLayer } from 'Iaso/components/maps/tools/CustomTileLayer';
import { CustomZoomControl } from 'Iaso/components/maps/tools/CustomZoomControl';
import { InvalidateOnResize } from 'Iaso/components/maps/tools/InvalidateOnResize';
import { Tile } from 'Iaso/components/maps/tools/TilesSwitchControl';
import tiles from 'Iaso/constants/mapTiles';
import { SxStyles } from 'Iaso/types/general';
import {
    CloseTooltipOnMoveStart,
    defaultCenter,
    defaultZoom,
} from 'Iaso/utils/map/mapUtils';

const styles = {
    container: {
        position: 'relative',
        flex: 1,
        minHeight: 0,
    },
    map: {
        position: 'absolute',
        inset: 0,
    },
} satisfies SxStyles;

export const AssignmentsMap: FC = () => {
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    return (
        <Box sx={styles.container}>
            <Box sx={styles.map}>
                <MapContainer
                    center={defaultCenter}
                    zoom={defaultZoom}
                    maxZoom={currentTile.maxZoom}
                    zoomControl={false}
                    scrollWheelZoom={false}
                    preferCanvas
                    style={{ height: '100%' }}
                >
                    <CloseTooltipOnMoveStart />
                    <InvalidateOnResize />
                    <CustomZoomControl />
                    <ScaleControl imperial={false} />
                    <CustomTileLayer
                        currentTile={currentTile}
                        setCurrentTile={setCurrentTile}
                    />
                </MapContainer>
            </Box>
        </Box>
    );
};
