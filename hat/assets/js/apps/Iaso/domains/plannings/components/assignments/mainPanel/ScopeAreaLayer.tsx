import React, { FC, useMemo } from 'react';
import { useTheme } from '@mui/material';
import L from 'leaflet';
import { GeoJSON, Pane } from 'react-leaflet';
import { GeoJson } from 'Iaso/components/maps/types';

// Above the overlay pane (400) so the outline stays on top of the org units.
const SCOPE_AREA_PANE_Z_INDEX = 450;

type Props = {
    orgUnitId: number;
    geoJson: GeoJson;
};

export const ScopeAreaLayer: FC<Props> = ({ orgUnitId, geoJson }) => {
    const theme = useTheme();
    const pathOptions: L.PathOptions = useMemo(
        () => ({ color: theme.palette.primary.main, weight: 3, fill: false }),
        [theme.palette.primary.main],
    );
    return (
        <Pane name="scopeArea" style={{ zIndex: SCOPE_AREA_PANE_Z_INDEX }}>
            <GeoJSON
                key={orgUnitId}
                data={geoJson}
                interactive={false}
                pathOptions={pathOptions}
            />
        </Pane>
    );
};
