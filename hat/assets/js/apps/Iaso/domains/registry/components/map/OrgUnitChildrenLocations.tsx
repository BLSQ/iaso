import L from 'leaflet';
import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Pane } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import {
    circleColorMarkerOptions,
    colorClusterCustomMarker,
} from '../../../../utils/map/mapUtils';

import { OrgUnit } from '../../../orgUnits/types/orgUnit';
import { OrgunitType } from '../../../orgUnits/types/orgunitTypes';

import MarkersListComponent from '../../../../components/maps/markers/MarkersListComponent';
import { MapToolTip } from './MapTooltip';
import { selectedOrgUnitColor } from './OrgUnitChildrenMap';

const MARKER_RADIUS = 8;

type Props = {
    selectedChildrenId: string | undefined;
    activeChildren: OrgUnit[];
    handleSingleClick: (
        ou: OrgUnit,
        event: L.LeafletMouseEvent | undefined,
    ) => void;
    handleDoubleClick: (event: L.LeafletMouseEvent, ou: OrgUnit) => void;
    showTooltip: boolean;
    clusterEnabled: boolean;
    index: number;
    subType: OrgunitType;
};

export const OrgUnitChildrenLocations: FunctionComponent<Props> = ({
    handleSingleClick,
    handleDoubleClick,
    activeChildren,
    showTooltip,
    clusterEnabled,
    index,
    subType,
    selectedChildrenId,
}) => {
    const orgUnitsMarkers = useMemo(() => {
        return activeChildren?.filter(
            childrenOrgUnit =>
                childrenOrgUnit.latitude &&
                childrenOrgUnit.longitude &&
                childrenOrgUnit.org_unit_type_id === subType.id,
        );
    }, [activeChildren, subType]);

    const getMarkerProps = useCallback(
        children => {
            const color =
                `${children.id}` === selectedChildrenId
                    ? selectedOrgUnitColor
                    : subType.color || '';
            return { ...circleColorMarkerOptions(color, MARKER_RADIUS) };
        },
        [selectedChildrenId, subType],
    );
    return (
        <Pane
            name={`children-locations-orgunit-type-${subType.id}`}
            style={{ zIndex: 600 + index }}
        >
            {clusterEnabled && (
                <MarkerClusterGroup
                    iconCreateFunction={cluster =>
                        colorClusterCustomMarker(cluster, subType.color || '')
                    }
                    polygonOptions={{
                        fillColor: subType.color || '',
                        color: subType.color || '',
                    }}
                    key={subType.id}
                >
                    <MarkersListComponent
                        key={`markers-${subType.id}`}
                        items={orgUnitsMarkers || []}
                        markerProps={getMarkerProps}
                        onDblclick={handleDoubleClick}
                        onMarkerClick={handleSingleClick}
                        tooltipProps={e => ({
                            permanent: showTooltip,
                            pane: 'popupPane',
                            label: e.name,
                        })}
                        TooltipComponent={MapToolTip}
                        isCircle
                    />
                </MarkerClusterGroup>
            )}
            {!clusterEnabled && (
                <MarkersListComponent
                    key={`markers-${subType.id}`}
                    items={orgUnitsMarkers || []}
                    markerProps={getMarkerProps}
                    onDblclick={handleDoubleClick}
                    onMarkerClick={handleSingleClick}
                    tooltipProps={e => ({
                        permanent: showTooltip,
                        pane: 'popupPane',
                        label: e.name,
                    })}
                    TooltipComponent={MapToolTip}
                    isCircle
                />
            )}
        </Pane>
    );
};
