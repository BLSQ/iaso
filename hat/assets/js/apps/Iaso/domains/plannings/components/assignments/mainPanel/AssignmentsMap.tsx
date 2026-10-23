import React, { FC } from 'react';
import { Box } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';
import { BaseMap } from 'Iaso/components/maps/maplibre/BaseMap';
import { SxStyles } from 'Iaso/types/general';
import { defaultCenter } from 'Iaso/utils/map/mapUtils';
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

const INITIAL_VIEW_STATE = {
    longitude: defaultCenter.lng,
    latitude: defaultCenter.lat,
    zoom: 3,
};

export const AssignmentsMap: FC = () => {
    const { planningId } = useAssignmentsParams();
    const { geoJson, bounds, isLoading } = useScopeArea(planningId);
    return (
        <Box sx={styles.container}>
            {isLoading ? (
                <LoadingSpinner absolute fixed={false} />
            ) : (
                <Box sx={styles.map}>
                    <BaseMap
                        initialViewState={INITIAL_VIEW_STATE}
                        bounds={bounds}
                    >
                        {geoJson && <ScopeAreaLayer geoJson={geoJson} />}
                    </BaseMap>
                </Box>
            )}
        </Box>
    );
};
