import React, {
    FunctionComponent,
    useState,
    useRef,
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
import { LoadingSpinner } from 'bluesquare-components';
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
import { Optional } from '../../../types/utils';

type Props = {
    orgUnit: OrgUnit;
    subOrgUnitTypes: OrgunitTypes;
};

export const OrgUnitChildrenMap: FunctionComponent<Props> = ({
    orgUnit,
    subOrgUnitTypes,
}) => {
    const theme = useTheme();
    const map: any = useRef();
    const bounds = useRef<Optional<Bounds | undefined>>();

    const { data: childrenOrgUnits, isFetching } = useGetOrgUnitsMapChildren(
        `${orgUnit.id}`,
        subOrgUnitTypes,
    );
    const getlegendOptions = useGetlegendOptions(orgUnit, subOrgUnitTypes);
    const [isMapFitted, setIsMapFitted] = useState<boolean>(false);
    const [legendOptions, setLegendOptions] = useState<Legend[]>(
        getlegendOptions(),
    );
    const [currentTile, setCurrentTile] = useState<Tile>(TILES.osm);

    const optionsObject = useMemo(
        () => keyBy(legendOptions, 'value'),
        [legendOptions],
    );
    const activeChildren: OrgUnit[] = useMemo(
        () =>
            childrenOrgUnits?.filter(
                children =>
                    optionsObject[`${children.org_unit_type_id}`]?.active,
            ) || [],
        [childrenOrgUnits, optionsObject],
    );
    const isOrgUnitActive: boolean =
        optionsObject[`${orgUnit.id}`]?.active || false;

    useEffect(() => {
        const newBounds: Bounds | undefined = mergeBounds(
            isOrgUnitActive ? getOrgUnitBounds(orgUnit) : undefined,
            getOrgUnitsBounds(activeChildren),
        );
        bounds.current = newBounds;
    }, [activeChildren, isOrgUnitActive, orgUnit]);

    useEffect(() => {
        if (!isFetching && childrenOrgUnits && !isMapFitted) {
            tryFitToBounds(bounds.current, map.current);
            setIsMapFitted(true);
        }
    }, [isFetching, childrenOrgUnits, isMapFitted, bounds]);

    if (isFetching)
        return (
            <Box position="relative" height={500}>
                <LoadingSpinner absolute />
            </Box>
        );
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
                style={{ height: '524px' }}
                center={DEFAULT_VIEWPORT.center}
                zoom={DEFAULT_VIEWPORT.zoom}
                scrollWheelZoom={false}
                zoomControl={false}
                contextmenu
            >
                <ZoomControl
                    fitToBounds={() => {
                        tryFitToBounds(bounds.current, map.current);
                    }}
                />
                <ScaleControl imperial={false} />
                <TileLayer
                    attribution={currentTile.attribution ?? ''}
                    url={currentTile.url}
                />

                {isOrgUnitActive && (
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
                            {activeChildren
                                ?.filter(childrenOrgUnit =>
                                    Boolean(childrenOrgUnit.geo_json),
                                )
                                .map(childrenOrgUnit => {
                                    if (
                                        childrenOrgUnit.org_unit_type_id ===
                                        subType.id
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
                            {activeChildren
                                ?.filter(childrenOrgUnit =>
                                    Boolean(
                                        childrenOrgUnit.latitude &&
                                            childrenOrgUnit.longitude,
                                    ),
                                )
                                .map(childrenOrgUnit => {
                                    if (
                                        childrenOrgUnit.org_unit_type_id ===
                                        subType.id
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
