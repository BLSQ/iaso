import { red } from '@mui/material/colors';
import { useTheme } from '@mui/styles';
import L from 'leaflet';
import React, { FunctionComponent } from 'react';
import { GeoJSON, Pane } from 'react-leaflet';
import { circleColorMarkerOptions } from '../../../../utils/map/mapUtils';

import CircleMarkerComponent from '../../../../components/maps/markers/CircleMarkerComponent';

import { OrgUnit } from '../../../orgUnits/types/orgUnit';

import { MapToolTip } from './MapTooltip';

type Props = {
    orgUnit: OrgUnit;
    showTooltip: boolean;
    isOrgUnitActive: boolean;
    selectedChildrenId: string | undefined;
    handleFeatureEvents: (
        ou: OrgUnit,
    ) => (feature: any, layer: L.Layer) => void;

    handleSingleClick: (
        ou: OrgUnit,
        event: L.LeafletMouseEvent | undefined,
    ) => void;
};

export const selectedOrgUnitColor = red[500];
export const OrgUnitLocation: FunctionComponent<Props> = ({
    orgUnit,
    showTooltip,
    isOrgUnitActive,
    selectedChildrenId,
    handleSingleClick,
    handleFeatureEvents,
}) => {
    const theme = useTheme();
    const color = selectedChildrenId
        ? theme.palette.primary.main
        : selectedOrgUnitColor;
    return isOrgUnitActive ? (
        <>
            {orgUnit.geo_json && (
                <Pane name="orgunit-shape" style={{ zIndex: 400 }}>
                    <GeoJSON
                        key={`orgunit-shape-${orgUnit.id}`}
                        data={orgUnit.geo_json}
                        onEachFeature={handleFeatureEvents(orgUnit)}
                        style={() => ({
                            color,
                        })}
                    >
                        <MapToolTip
                            permanent={showTooltip}
                            pane="popupPane"
                            label={orgUnit.name}
                        />
                    </GeoJSON>
                </Pane>
            )}
            {orgUnit.latitude && orgUnit.longitude && (
                <CircleMarkerComponent
                    item={{
                        latitude: orgUnit.latitude,
                        longitude: orgUnit.longitude,
                    }}
                    markerProps={() => ({
                        ...circleColorMarkerOptions(color),
                        key: `markers-${orgUnit.id}-${showTooltip}`,
                    })}
                    popupProps={() => ({
                        orgUnit,
                    })}
                    onClick={handleSingleClick}
                    tooltipProps={() => ({
                        permanent: showTooltip,
                        pane: 'popupPane',
                        label: orgUnit.name,
                    })}
                    TooltipComponent={MapToolTip}
                />
            )}
        </>
    ) : null;
};
