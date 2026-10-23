import React, { FC, useMemo } from 'react';
import { Box } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';
import { BaseMap } from 'Iaso/components/maps/maplibre/BaseMap';
import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { SxStyles } from 'Iaso/types/general';
import { defaultCenter } from 'Iaso/utils/map/mapUtils';
import { useAssignmentsParams } from '../../../hooks/useAssignmentsParams';
import { AssignableOrgUnitsLayer } from './AssignableOrgUnitsLayer';
import { ScopeAreaLayer } from './ScopeAreaLayer';
import { useAssignableOrgUnits } from './useAssignableOrgUnits';
import { useAssignments } from './useAssignments';
import { useScopeArea } from './useScopeArea';
import { getAssigneeColorByOrgUnitId } from './utils';

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

type Props = {
    tree: TeamTreeNode;
};

export const AssignmentsMap: FC<Props> = ({ tree }) => {
    const { planningId } = useAssignmentsParams();
    const { orgUnitId, geoJson, bounds, isLoading } = useScopeArea(planningId);
    const { data: assignableOrgUnits } = useAssignableOrgUnits(
        planningId,
        orgUnitId,
    );
    const { data: assignments } = useAssignments(planningId);
    const colorByOrgUnitId = useMemo(
        () => getAssigneeColorByOrgUnitId(tree, assignments ?? []),
        [tree, assignments],
    );
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
                        {assignableOrgUnits && (
                            <AssignableOrgUnitsLayer
                                orgUnits={assignableOrgUnits}
                                colorByOrgUnitId={colorByOrgUnitId}
                            />
                        )}
                        {geoJson && <ScopeAreaLayer geoJson={geoJson} />}
                    </BaseMap>
                </Box>
            )}
        </Box>
    );
};
