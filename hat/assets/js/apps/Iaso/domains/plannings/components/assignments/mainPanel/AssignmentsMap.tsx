import React, { FC, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';
import L from 'leaflet';
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
import { useAssignmentsParams } from '../../../hooks/useAssignmentsParams';
import { ScopeAreaLayer } from './ScopeAreaLayer';
import { useScopeArea } from './useScopeArea';

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
    const { planningId } = useAssignmentsParams();
    const { orgUnitId, geoJson, bounds, isLoading } = useScopeArea(planningId);
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    const boundsOptions: L.FitBoundsOptions = useMemo(
        () => ({ padding: [20, 20], maxZoom: currentTile.maxZoom }),
        [currentTile.maxZoom],
    );

    return (
        <Box sx={styles.container}>
            {isLoading && <LoadingSpinner absolute fixed={false} />}
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
                    <CustomZoomControl
                        bounds={bounds}
                        boundsOptions={boundsOptions}
                        fitOnLoad
                    />
                    <ScaleControl imperial={false} />
                    <CustomTileLayer
                        currentTile={currentTile}
                        setCurrentTile={setCurrentTile}
                    />
                    {orgUnitId && geoJson && (
                        <ScopeAreaLayer
                            orgUnitId={orgUnitId}
                            geoJson={geoJson}
                        />
                    )}
                </MapContainer>
            </Box>
        </Box>
    );
};
