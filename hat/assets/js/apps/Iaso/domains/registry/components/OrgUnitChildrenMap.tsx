import React, {
    FunctionComponent,
    useState,
    useRef,
    useEffect,
    useMemo,
    useCallback,
} from 'react';
import { useDispatch } from 'react-redux';
import {
    Map,
    TileLayer,
    GeoJSON,
    Pane,
    ScaleControl,
    Tooltip,
} from 'react-leaflet';
import { LoadingSpinner } from 'bluesquare-components';
import { Box, useTheme, makeStyles } from '@material-ui/core';
import classNames from 'classnames';

import { keyBy } from 'lodash';

import { TilesSwitch, Tile } from '../../../components/maps/tools/TileSwitch';
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
import { RegistryDetailParams } from '../types';
import { redirectToReplace } from '../../../routing/actions';
import { baseUrls } from '../../../constants/urls';

type Props = {
    orgUnit: OrgUnit;
    subOrgUnitTypes: OrgunitTypes;
    orgUnitChildren?: OrgUnit[];
    isFetchingChildren: boolean;
    params: RegistryDetailParams;
};

const useStyles = makeStyles(() => ({
    mapContainer: {
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
    const map: any = useRef();
    const dispatch = useDispatch();

    const bounds = useRef<Optional<Bounds | undefined>>();
    const [isMapFullScreen, setIsMapFullScreen] = useState<boolean>(
        params.isFullScreen === 'true',
    );
    const [currentTile, setCurrentTile] = useState<Tile>(TILES.osm);
    const [showTooltip, setShowTooltip] = useState<boolean>(
        params.showTooltip === 'true',
    );

    const getlegendOptions = useGetlegendOptions(orgUnit, subOrgUnitTypes);
    const [isMapFitted, setIsMapFitted] = useState<boolean>(false);
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

    useEffect(() => {
        const newBounds: Bounds | undefined = mergeBounds(
            isOrgUnitActive ? getOrgUnitBounds(orgUnit) : undefined,
            getOrgUnitsBounds(activeChildren),
        );
        bounds.current = newBounds;
    }, [activeChildren, isOrgUnitActive, orgUnit]);

    useEffect(() => {
        if (!isFetchingChildren && orgUnitChildren && !isMapFitted) {
            tryFitToBounds(bounds.current, map.current);
            setIsMapFitted(true);
        }
    }, [isFetchingChildren, orgUnitChildren, isMapFitted, bounds]);

    useEffect(() => {
        map?.current?.leafletElement?.invalidateSize();
    }, [isMapFullScreen]);

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
            <MapToggleFullscreen
                isMapFullScreen={isMapFullScreen}
                setIsMapFullScreen={handleToggleFullScreen}
            />
            <MapToggleTooltips
                showTooltip={showTooltip}
                setShowTooltip={handleToggleTooltip}
            />
            <MapLegend options={legendOptions} setOptions={setLegendOptions} />
            <TilesSwitch
                currentTile={currentTile}
                setCurrentTile={setCurrentTile}
            />
            <Map
                zoomSnap={0.25}
                maxZoom={currentTile.maxZoom}
                ref={map}
                style={{
                    height: isMapFullScreen ? '100vh' : '542px',
                    width: isMapFullScreen ? '100vw' : '100%',
                }}
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
                                                style={() => ({
                                                    color: subType.color || '',
                                                })}
                                                data={childrenOrgUnit.geo_json}
                                            >
                                                <MapPopUp
                                                    orgUnit={childrenOrgUnit}
                                                />
                                                <Tooltip
                                                    permanent={showTooltip}
                                                >
                                                    {childrenOrgUnit.name}
                                                </Tooltip>
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
                                                    <Tooltip
                                                        permanent={showTooltip}
                                                    >
                                                        {childrenOrgUnit.name}
                                                    </Tooltip>
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
            </Map>
        </Box>
    );
};
