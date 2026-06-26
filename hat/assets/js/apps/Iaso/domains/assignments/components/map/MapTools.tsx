import React, { Dispatch, FunctionComponent, SetStateAction } from 'react';
import L from 'leaflet';
import { ScaleControl } from 'react-leaflet';
import { CustomTileLayer } from 'Iaso/components/maps/tools/CustomTileLayer';
import { CustomZoomControl } from 'Iaso/components/maps/tools/CustomZoomControl';
import { Tile } from 'Iaso/components/maps/tools/TilesSwitchControl';
import {
    OrgUnitTypeHierarchyDropdownValue,
    OrgUnitTypeHierarchyDropdownValues,
} from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { Planning } from 'Iaso/domains/plannings/types';
import { Bounds, CloseTooltipOnMoveStart } from 'Iaso/utils/map/mapUtils';
import { MapLegend } from './MapLegend';

type Props = {
    orgUnitTypeList?: OrgUnitTypeHierarchyDropdownValues;
    planning?: Planning;
    selectedOrgUnitTypes: OrgUnitTypeHierarchyDropdownValue[];
    setSelectedOrgUnitTypes: Dispatch<
        SetStateAction<OrgUnitTypeHierarchyDropdownValue[]>
    >;
    bounds?: Bounds;
    currentTile: Tile;
    setCurrentTile: (tile: Tile) => void;
    boundsOptions: L.FitBoundsOptions;
};

export const MapTools: FunctionComponent<Props> = ({
    orgUnitTypeList,
    planning,
    selectedOrgUnitTypes,
    setSelectedOrgUnitTypes,
    bounds,
    currentTile,
    setCurrentTile,
    boundsOptions,
}) => {
    return (
        <>
            {orgUnitTypeList && planning && (
                <MapLegend
                    orgUnitTypeList={orgUnitTypeList}
                    selectedOrgUnitTypes={selectedOrgUnitTypes}
                    setSelectedOrgUnitTypes={setSelectedOrgUnitTypes}
                />
            )}
            <CloseTooltipOnMoveStart />
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
        </>
    );
};
