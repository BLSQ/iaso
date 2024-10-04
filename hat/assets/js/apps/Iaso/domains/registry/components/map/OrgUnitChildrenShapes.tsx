import L from 'leaflet';
import React, { FunctionComponent, useMemo } from 'react';
import { GeoJSON, Pane } from 'react-leaflet';

import { OrgUnit } from '../../../orgUnits/types/orgUnit';
import { OrgunitType } from '../../../orgUnits/types/orgunitTypes';

import { MapToolTip } from './MapTooltip';
import { selectedOrgUnitColor } from './OrgUnitChildrenMap';

type Props = {
    selectedChildrenId: string | undefined;
    activeChildren: OrgUnit[];
    handleFeatureEvents: (
        ou: OrgUnit,
    ) => (feature: any, layer: L.Layer) => void;
    showTooltip: boolean;
    index: number;
    subType: OrgunitType;
};

export const OrgUnitChildrenShapes: FunctionComponent<Props> = ({
    handleFeatureEvents,
    activeChildren,
    showTooltip,
    index,
    subType,
    selectedChildrenId,
}) => {
    const orgUnitsShapes = useMemo(
        () =>
            activeChildren?.filter(
                childrenOrgUnit =>
                    Boolean(childrenOrgUnit.geo_json) &&
                    childrenOrgUnit.org_unit_type_id === subType.id,
            ),
        [activeChildren, subType.id],
    );

    return (
        <Pane
            name={`children-shapes-orgunit-type-${subType.id}-${showTooltip}`}
            style={{ zIndex: 401 + index }}
        >
            {orgUnitsShapes.map(childrenOrgUnit => (
                <GeoJSON
                    key={childrenOrgUnit.id}
                    onEachFeature={handleFeatureEvents(childrenOrgUnit)}
                    style={() => ({
                        color:
                            `${childrenOrgUnit.id}` === selectedChildrenId
                                ? selectedOrgUnitColor
                                : subType.color || '',
                    })}
                    data={childrenOrgUnit.geo_json}
                >
                    <MapToolTip
                        permanent={showTooltip}
                        pane="popupPane"
                        label={childrenOrgUnit.name}
                    />
                </GeoJSON>
            ))}
        </Pane>
    );
};
