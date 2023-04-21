import React, {
    FunctionComponent,
    useState,
    useRef,
    useCallback,
    useEffect,
    useMemo,
} from 'react';
import {
    Map,
    TileLayer,
    GeoJSON,
    Pane,
    ScaleControl,
    Tooltip,
} from 'react-leaflet';
import { Box, useTheme } from '@material-ui/core';

import { keyBy } from 'lodash';
import { useGetOrgUnitsMapChildren } from '../hooks/useGetOrgUnit';

import { TilesSwitch, Tile } from '../../../components/maps/tools/TileSwitch';
import { MapLegend } from './MapLegend';
import CircleMarkerComponent from '../../../components/maps/markers/CircleMarkerComponent';

import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../orgUnits/types/orgunitTypes';

import { Legend, useGetlegendOptions } from '../hooks/useGetLegendOptions';

import TILES from '../../../constants/mapTiles';
import {
    circleColorMarkerOptions,
    ZoomControl,
    getOrgUnitBounds,
    getOrgUnitsBounds,
    DEFAULT_VIEWPORT,
    mergeBounds,
    Bounds,
    tryFitToBounds,
} from '../../../utils/mapUtils';
import { MapPopUp } from './MapPopUp';

type Props = {
    orgUnit: OrgUnit;
    subOrgUnitTypes: OrgunitTypes;
};

export const OrgUnitChildrenMap: FunctionComponent<Props> = ({
    orgUnit,
    subOrgUnitTypes,
}) => {
    const { data: childrenOrgUnits, isFetching } = useGetOrgUnitsMapChildren(
        `${orgUnit.id}`,
        subOrgUnitTypes,
    );
    const getlegendOptions = useGetlegendOptions(orgUnit, subOrgUnitTypes);
    const [isMapFit, setIsMapFit] = useState<boolean>(false);
    const [legendOptions, setLegendOptions] = useState<Legend[]>(
        getlegendOptions(),
    );
    const optionsObject = useMemo(
        () => keyBy(legendOptions, 'value'),
        [legendOptions],
    );
    const map: any = useRef();
    const theme = useTheme();
    const [currentTile, setCurrentTile] = useState<Tile>(TILES.osm);
    const fitToBounds = useCallback(() => {
        let orgUnitBounds: Bounds | undefined;
        if (optionsObject[`${orgUnit.id}`]?.active) {
            orgUnitBounds = getOrgUnitBounds(orgUnit);
        }
        const childrenOrgUnitsActive =
            childrenOrgUnits?.filter(
                children =>
                    optionsObject[`${children.org_unit_type_id}`]?.active,
            ) || [];
        console.log('childrenOrgUnitsActive', childrenOrgUnitsActive);
        const bounds: Bounds | undefined = mergeBounds(
            orgUnitBounds,
            getOrgUnitsBounds(childrenOrgUnitsActive),
        );
        tryFitToBounds(bounds, map.current);
    }, [childrenOrgUnits, optionsObject, orgUnit]);
    useEffect(() => {
        if (!isFetching && childrenOrgUnits && !isMapFit) {
            fitToBounds();
            setIsMapFit(true);
        }
    }, [isFetching, fitToBounds, childrenOrgUnits, isMapFit]);
    if (isFetching) return null;
    return (
        <Box position="relative">
            <MapLegend options={legendOptions} setOptions={setLegendOptions} />
            <TilesSwitch
                currentTile={currentTile}
                setCurrentTile={setCurrentTile}
            />
            <Map
                zoomSnap={0.25}
                maxZoom={currentTile.maxZoom}
                ref={map}
                style={{ height: '453px' }}
                center={DEFAULT_VIEWPORT.center}
                zoom={DEFAULT_VIEWPORT.zoom}
                scrollWheelZoom={false}
                zoomControl={false}
                contextmenu
            >
                <ZoomControl fitToBounds={fitToBounds} />
                <ScaleControl imperial={false} />
                <TileLayer
                    attribution={currentTile.attribution ?? ''}
                    url={currentTile.url}
                />

                {optionsObject[`${orgUnit.id}`]?.active && (
                    <>
                        {orgUnit.geo_json && (
                            <Pane name="orgunit-shapes">
                                <GeoJSON
                                    className="secondary"
                                    data={orgUnit.geo_json}
                                    style={() => ({
                                        color: theme.palette.secondary.main,
                                    })}
                                >
                                    <Tooltip>{orgUnit.name}</Tooltip>
                                </GeoJSON>
                            </Pane>
                        )}
                        {orgUnit.latitude && orgUnit.longitude && (
                            <CircleMarkerComponent
                                item={{
                                    latitude: orgUnit.latitude,
                                    longitude: orgUnit.longitude,
                                }}
                                TooltipComponent={() => (
                                    <Tooltip>{orgUnit.name}</Tooltip>
                                )}
                                markerProps={() => ({
                                    ...circleColorMarkerOptions(
                                        theme.palette.secondary.main,
                                    ),
                                })}
                            />
                        )}
                    </>
                )}
                {subOrgUnitTypes.map((subType, index) => (
                    <Box key={subType.id}>
                        <Pane
                            name={`children-shapes-orgunit-type-${subType.id}`}
                            style={{ zIndex: 400 + index }}
                        >
                            {childrenOrgUnits
                                ?.filter(childrenOrgUnit =>
                                    Boolean(childrenOrgUnit.geo_json),
                                )
                                .map(childrenOrgUnit => {
                                    if (
                                        childrenOrgUnit.org_unit_type_id ===
                                            subType.id &&
                                        optionsObject[`${subType.id}`]?.active
                                    ) {
                                        return (
                                            <GeoJSON
                                                key={childrenOrgUnit.id}
                                                style={() => ({
                                                    color: subType.color || '',
                                                })}
                                                data={childrenOrgUnit.geo_json}
                                            >
                                                <MapPopUp
                                                    orgUnit={childrenOrgUnit}
                                                />
                                            </GeoJSON>
                                        );
                                    }
                                    return null;
                                })}
                        </Pane>

                        <Pane
                            name={`children-locations-orgunit-type-${subType.id}`}
                            style={{ zIndex: 600 + index }}
                        >
                            {childrenOrgUnits
                                ?.filter(childrenOrgUnit =>
                                    Boolean(
                                        childrenOrgUnit.latitude &&
                                            childrenOrgUnit.longitude,
                                    ),
                                )
                                .map(childrenOrgUnit => {
                                    if (
                                        childrenOrgUnit.org_unit_type_id ===
                                            subType.id &&
                                        optionsObject[`${subType.id}`]?.active
                                    ) {
                                        const { latitude, longitude } =
                                            childrenOrgUnit;
                                        return (
                                            <CircleMarkerComponent
                                                PopupComponent={MapPopUp}
                                                popupProps={() => ({
                                                    orgUnit: childrenOrgUnit,
                                                })}
                                                key={childrenOrgUnit.id}
                                                markerProps={() => ({
                                                    ...circleColorMarkerOptions(
                                                        subType.color || '',
                                                    ),
                                                })}
                                                item={{
                                                    latitude,
                                                    longitude,
                                                }}
                                            />
                                        );
                                    }
                                    return null;
                                })}
                        </Pane>
                    </Box>
                ))}
            </Map>
        </Box>
    );
};
