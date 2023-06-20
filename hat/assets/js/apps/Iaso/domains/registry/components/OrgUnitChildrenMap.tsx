import React, {
    FunctionComponent,
    useState,
    useMemo,
    useCallback,
} from 'react';
import { useDispatch } from 'react-redux';
import {
    MapContainer,
    GeoJSON,
    Pane,
    ScaleControl,
    Tooltip,
} from 'react-leaflet';
import { LoadingSpinner } from 'bluesquare-components';
import { Box, useTheme, makeStyles } from '@material-ui/core';
import classNames from 'classnames';

import { keyBy } from 'lodash';

import { Tile } from '../../../components/maps/tools/TilesSwitchControl';
import { MapLegend } from './MapLegend';
import CircleMarkerComponent from '../../../components/maps/markers/CircleMarkerComponent';

import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../orgUnits/types/orgunitTypes';

import { Legend, useGetlegendOptions } from '../hooks/useGetLegendOptions';

import { MapToggleTooltips } from './MapToggleTooltips';
import { MapToggleFullscreen } from './MapToggleFullscreen';

import TILES from '../../../constants/mapTiles';
import {
    circleColorMarkerOptions,
    getOrgUnitBounds,
    getOrgUnitsBounds,
    mergeBounds,
} from '../../../utils/map/mapUtils';
import { MapPopUp } from './MapPopUp';
import { RegistryDetailParams } from '../types';
import { redirectToReplace } from '../../../routing/actions';
import { baseUrls } from '../../../constants/urls';
import { CustomTileLayer } from '../../../components/maps/tools/CustomTileLayer';
import { CustomZoomControl } from '../../../components/maps/tools/CustomZoomControl';

type Props = {
    orgUnit: OrgUnit;
    subOrgUnitTypes: OrgunitTypes;
    orgUnitChildren?: OrgUnit[];
    isFetchingChildren: boolean;
    params: RegistryDetailParams;
};

const boundsOptions = {
    padding: [50, 50],
};

const useStyles = makeStyles(() => ({
    mapContainer: {
        height: '542px',
        position: 'relative',
        '& .leaflet-control-zoom': {
            borderBottom: 'none',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
        },
    },
    fullScreen: {
        position: 'fixed',
        top: '64px',
        left: '0',
        width: '100vw',
        height: 'calc(100vh - 64px)',
        zIndex: 10000,
    },
}));

export const OrgUnitChildrenMap: FunctionComponent<Props> = ({
    orgUnit,
    subOrgUnitTypes,
    orgUnitChildren,
    isFetchingChildren,
    params,
}) => {
    const classes: Record<string, string> = useStyles();
    const theme = useTheme();
    const dispatch = useDispatch();

    const [isMapFullScreen, setIsMapFullScreen] = useState<boolean>(
        params.isFullScreen === 'true',
    );
    const [currentTile, setCurrentTile] = useState<Tile>(TILES.osm);
    const [showTooltip, setShowTooltip] = useState<boolean>(
        params.showTooltip === 'true',
    );
    const getlegendOptions = useGetlegendOptions(orgUnit, subOrgUnitTypes);
    const [legendOptions, setLegendOptions] = useState<Legend[]>(
        getlegendOptions(),
    );

    const optionsObject = useMemo(
        () => keyBy(legendOptions, 'value'),
        [legendOptions],
    );
    const activeChildren: OrgUnit[] = useMemo(
        () =>
            orgUnitChildren?.filter(
                children =>
                    optionsObject[`${children.org_unit_type_id}`]?.active,
            ) || [],
        [orgUnitChildren, optionsObject],
    );
    const isOrgUnitActive: boolean =
        optionsObject[`${orgUnit.id}`]?.active || false;

    const bounds = useMemo(
        () =>
            mergeBounds(
                isOrgUnitActive ? getOrgUnitBounds(orgUnit) : undefined,
                getOrgUnitsBounds(activeChildren),
            ),
        [activeChildren, isOrgUnitActive, orgUnit],
    );

    const handleToggleTooltip = useCallback(
        (isVisible: boolean) => {
            setShowTooltip(isVisible);
            dispatch(
                redirectToReplace(baseUrls.registryDetail, {
                    ...params,
                    showTooltip: isVisible,
                }),
            );
        },
        [dispatch, params],
    );
    const handleToggleFullScreen = useCallback(
        (isFull: boolean) => {
            setIsMapFullScreen(isFull);
            dispatch(
                redirectToReplace(baseUrls.registryDetail, {
                    ...params,
                    isFullScreen: isFull,
                }),
            );
        },
        [dispatch, params],
    );

    if (isFetchingChildren)
        return (
            <Box position="relative" height={500}>
                <LoadingSpinner absolute />
            </Box>
        );

    return (
        <Box
            className={classNames(
                classes.mapContainer,
                isMapFullScreen && classes.fullScreen,
            )}
        >
            <MapLegend options={legendOptions} setOptions={setLegendOptions} />

            <MapContainer
                maxZoom={currentTile.maxZoom}
                style={{
                    minHeight: '542px',
                    height: '100%',
                }}
                center={[1, 20]}
                zoom={3}
                scrollWheelZoom={false}
                zoomControl={false}
                contextmenu
                bounds={bounds}
                boundsOptions={boundsOptions}
                trackResize
            >
                <MapToggleTooltips
                    showTooltip={showTooltip}
                    setShowTooltip={handleToggleTooltip}
                />
                <MapToggleFullscreen
                    isMapFullScreen={isMapFullScreen}
                    setIsMapFullScreen={handleToggleFullScreen}
                />
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

                {isOrgUnitActive && (
                    <>
                        {orgUnit.geo_json && (
                            <Pane name="orgunit-shapes">
                                <GeoJSON
                                    // @ts-ignore TODO: fix this type problem
                                    className="secondary"
                                    data={orgUnit.geo_json}
                                    style={() => ({
                                        color: theme.palette.secondary.main,
                                    })}
                                />
                            </Pane>
                        )}
                        {orgUnit.latitude && orgUnit.longitude && (
                            <CircleMarkerComponent
                                item={{
                                    latitude: orgUnit.latitude,
                                    longitude: orgUnit.longitude,
                                }}
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
                                                // @ts-ignore TODO: fix this type problem
                                                style={() => ({
                                                    color: subType.color || '',
                                                })}
                                                data={childrenOrgUnit.geo_json}
                                            >
                                                <MapPopUp
                                                    orgUnit={childrenOrgUnit}
                                                />
                                                {showTooltip && (
                                                    <Tooltip
                                                        // @ts-ignore TODO: fix this type problem
                                                        permanent
                                                        pane="popupPane"
                                                    >
                                                        {childrenOrgUnit.name}
                                                    </Tooltip>
                                                )}
                                                {!showTooltip && (
                                                    // @ts-ignore TODO: fix this type problem
                                                    <Tooltip pane="popupPane">
                                                        {childrenOrgUnit.name}
                                                    </Tooltip>
                                                )}
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
                                                TooltipComponent={() => (
                                                    <>
                                                        {showTooltip && (
                                                            <Tooltip
                                                                // @ts-ignore TODO: fix this type problem
                                                                permanent
                                                                pane="popupPane"
                                                            >
                                                                {
                                                                    childrenOrgUnit.name
                                                                }
                                                            </Tooltip>
                                                        )}
                                                        {!showTooltip && (
                                                            // @ts-ignore TODO: fix this type problem
                                                            <Tooltip pane="popupPane">
                                                                {
                                                                    childrenOrgUnit.name
                                                                }
                                                            </Tooltip>
                                                        )}
                                                    </>
                                                )}
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
            </MapContainer>
        </Box>
    );
};
