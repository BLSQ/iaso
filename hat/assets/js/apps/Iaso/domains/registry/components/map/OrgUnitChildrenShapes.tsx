import L from 'leaflet';
import React, { FunctionComponent, useMemo } from 'react';
import { GeoJSON, Pane } from 'react-leaflet';

import { OrgUnit } from '../../../orgUnits/types/orgUnit';
import { OrgunitType } from '../../../orgUnits/types/orgunitTypes';

import { MapToolTip } from './MapTooltip';
import { selectedOrgUnitColor } from './OrgUnitChildrenMap';

type Props = {
    selectedChildren: OrgUnit | undefined;
    activeChildren: OrgUnit[];
    handleFeatureEvents: (
        // eslint-disable-next-line no-unused-vars
        ou: OrgUnit,
        // eslint-disable-next-line no-unused-vars
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
    selectedChildren,
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
                            childrenOrgUnit.id === selectedChildren?.id
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
