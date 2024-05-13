import { Box } from '@mui/material';
import { red } from '@mui/material/colors';
import { makeStyles, useTheme } from '@mui/styles';
import { LoadingSpinner, commonStyles } from 'bluesquare-components';
import classNames from 'classnames';
import L from 'leaflet';
import { keyBy } from 'lodash';
import React, {
    Dispatch,
    FunctionComponent,
    SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { GeoJSON, MapContainer, Pane, ScaleControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { useDispatch } from 'react-redux';
import {
    circleColorMarkerOptions,
    colorClusterCustomMarker,
    getOrgUnitBounds,
    getOrgUnitsBounds,
    mergeBounds,
} from '../../../utils/map/mapUtils';

import CircleMarkerComponent from '../../../components/maps/markers/CircleMarkerComponent';
import { Tile } from '../../../components/maps/tools/TilesSwitchControl';
import { MapLegend } from './MapLegend';

import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../orgUnits/types/orgunitTypes';

import { Legend, useGetlegendOptions } from '../hooks/useGetLegendOptions';

import { MapToggleFullscreen } from './MapToggleFullscreen';

import MarkersListComponent from '../../../components/maps/markers/MarkersListComponent';
import { CustomTileLayer } from '../../../components/maps/tools/CustomTileLayer';
import { CustomZoomControl } from '../../../components/maps/tools/CustomZoomControl';
import TILES from '../../../constants/mapTiles';
import { baseUrls } from '../../../constants/urls';
import { redirectTo, redirectToReplace } from '../../../routing/actions';
import { RegistryDetailParams } from '../types';
import { MapSettings, Settings } from './MapSettings';
import { MapToolTip } from './MapTooltip';

type Props = {
    orgUnit: OrgUnit;
    subOrgUnitTypes: OrgunitTypes;
    orgUnitChildren?: OrgUnit[];
    isFetchingChildren: boolean;
    params: RegistryDetailParams;
    setSelectedChildren: Dispatch<SetStateAction<OrgUnit | undefined>>;
    selectedChildren: OrgUnit | undefined;
};

const boundsOptions = {
    padding: [50, 50],
};

const useStyles = makeStyles(theme => ({
    mapContainer: {
        ...commonStyles(theme).mapContainer,
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

export const selectedOrgUnitColor = red[500];
export const OrgUnitChildrenMap: FunctionComponent<Props> = ({
    orgUnit,
    subOrgUnitTypes,
    orgUnitChildren,
    isFetchingChildren,
    params,
    setSelectedChildren,
    selectedChildren,
}) => {
    const classes: Record<string, string> = useStyles();
    const dispatch = useDispatch();
    const [settings, setSettings] = useState<Settings>({
        showTooltip: params.showTooltip === 'true',
        useCluster: params.useCluster === 'true',
    });
    const theme = useTheme();
    const [isMapFullScreen, setIsMapFullScreen] = useState<boolean>(
        params.isFullScreen === 'true',
    );
    const [currentTile, setCurrentTile] = useState<Tile>(TILES.osm);
    const getlegendOptions = useGetlegendOptions(orgUnit);
    const [legendOptions, setLegendOptions] = useState<Legend[]>([]);
    useEffect(() => {
        if (legendOptions.length === 0 && subOrgUnitTypes.length > 0) {
            setLegendOptions(getlegendOptions(subOrgUnitTypes));
        }
    }, [getlegendOptions, legendOptions, subOrgUnitTypes]);

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
        Object.keys(optionsObject).length === 0
            ? true
            : optionsObject[`${orgUnit.id}`]?.active || false;

    const { showTooltip, useCluster } = settings;
    const bounds = useMemo(
        () =>
            mergeBounds(
                isOrgUnitActive ? getOrgUnitBounds(orgUnit) : undefined,
                getOrgUnitsBounds(activeChildren),
            ),
        [activeChildren, isOrgUnitActive, orgUnit],
    );
    const handleChangeSettings = useCallback(
        (setting: string) => {
            const newSetting = !settings[setting];
            setSettings(prevSettings => {
                return {
                    ...prevSettings,
                    [setting]: newSetting,
                };
            });

            dispatch(
                redirectToReplace(baseUrls.registry, {
                    ...params,
                    [setting]: `${newSetting}`,
                }),
            );
        },
        [dispatch, params, settings],
    );

    const handleToggleFullScreen = useCallback(
        (isFull: boolean) => {
            setIsMapFullScreen(isFull);
            dispatch(
                redirectToReplace(baseUrls.registry, {
                    ...params,
                    isFullScreen: `${isFull}`,
                }),
            );
        },
        [dispatch, params],
    );
    const handleDoubleClick = useCallback(
        (event: L.LeafletMouseEvent, ou: OrgUnit) => {
            event.originalEvent.stopPropagation();
            const url = `/${baseUrls.registry}/orgUnitId/${ou?.id}`;
            dispatch(redirectTo(url));
        },
        [dispatch],
    );
    const handleSingleClick = useCallback(
        (ou: OrgUnit, event: L.LeafletMouseEvent | undefined) => {
            event?.originalEvent.stopPropagation();
            setSelectedChildren(
                ou.id === selectedChildren?.id ? undefined : ou,
            );
        },
        [setSelectedChildren, selectedChildren],
    );

    const handleFeatureEvents = useCallback(
        (ou: OrgUnit) => (_, layer) => {
            layer.on('dblclick', event => handleDoubleClick(event, ou));
            layer.on('click', event => handleSingleClick(ou, event));
        },
        [handleDoubleClick, handleSingleClick],
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
                doubleClickZoom={false}
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
                <MapSettings
                    settings={settings}
                    handleChangeSettings={handleChangeSettings}
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
                            <Pane name="orgunit-shapes" style={{ zIndex: 400 }}>
                                <GeoJSON
                                    data={orgUnit.geo_json}
                                    style={() => ({
                                        color: !selectedChildren
                                            ? selectedOrgUnitColor
                                            : theme.palette.primary.main,
                                    })}
                                >
                                    {showTooltip && (
                                        <MapToolTip
                                            permanent
                                            pane="popupPane"
                                            label={orgUnit.name}
                                        />
                                    )}
                                    {!showTooltip && (
                                        <MapToolTip
                                            pane="popupPane"
                                            label={orgUnit.name}
                                        />
                                    )}
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
                                    ...circleColorMarkerOptions(
                                        !selectedChildren
                                            ? selectedOrgUnitColor
                                            : theme.palette.primary.main,
                                    ),
                                    key: `markers-${orgUnit.id}-${showTooltip}`,
                                })}
                                popupProps={() => ({
                                    orgUnit,
                                })}
                                tooltipProps={() => ({
                                    permanent: showTooltip,
                                    pane: 'popupPane',
                                    label: orgUnit.name,
                                })}
                                TooltipComponent={MapToolTip}
                            />
                        )}
                    </>
                )}
                {subOrgUnitTypes.map((subType, index) => {
                    const orgUnitsShapes = activeChildren?.filter(
                        childrenOrgUnit =>
                            Boolean(childrenOrgUnit.geo_json) &&
                            childrenOrgUnit.org_unit_type_id === subType.id,
                    );
                    const orgUnitsMarkers = activeChildren?.filter(
                        childrenOrgUnit =>
                            childrenOrgUnit.latitude &&
                            childrenOrgUnit.longitude &&
                            childrenOrgUnit.org_unit_type_id === subType.id,
                    );
                    return (
                        <Box key={subType.id}>
                            <Pane
                                name={`children-shapes-orgunit-type-${subType.id}`}
                                style={{ zIndex: 401 + index }}
                            >
                                {orgUnitsShapes.map(childrenOrgUnit => (
                                    <GeoJSON
                                        key={childrenOrgUnit.id}
                                        onEachFeature={handleFeatureEvents(
                                            childrenOrgUnit,
                                        )}
                                        style={() => ({
                                            color:
                                                childrenOrgUnit.id ===
                                                selectedChildren?.id
                                                    ? selectedOrgUnitColor
                                                    : subType.color || '',
                                        })}
                                        data={childrenOrgUnit.geo_json}
                                    >
                                        {showTooltip && (
                                            <MapToolTip
                                                permanent
                                                pane="popupPane"
                                                label={childrenOrgUnit.name}
                                            />
                                        )}
                                        {!showTooltip && (
                                            <MapToolTip
                                                pane="popupPane"
                                                label={childrenOrgUnit.name}
                                            />
                                        )}
                                    </GeoJSON>
                                ))}
                            </Pane>

                            <Pane
                                name={`children-locations-orgunit-type-${subType.id}`}
                                style={{ zIndex: 600 + index }}
                            >
                                {useCluster && (
                                    <>
                                        <MarkerClusterGroup
                                            iconCreateFunction={cluster =>
                                                colorClusterCustomMarker(
                                                    cluster,
                                                    subType.color || '',
                                                )
                                            }
                                            polygonOptions={{
                                                fillColor: subType.color || '',
                                                color: subType.color || '',
                                            }}
                                            key={subType.id}
                                        >
                                            <MarkersListComponent
                                                key={`markers-${subType.id}-${showTooltip}-${selectedChildren?.id}`}
                                                items={orgUnitsMarkers || []}
                                                markerProps={children => ({
                                                    ...circleColorMarkerOptions(
                                                        children.id ===
                                                            selectedChildren?.id
                                                            ? selectedOrgUnitColor
                                                            : subType.color ||
                                                                  '',
                                                    ),
                                                    radius: 12,
                                                })}
                                                onDblclick={handleDoubleClick}
                                                onMarkerClick={
                                                    handleSingleClick
                                                }
                                                tooltipProps={e => ({
                                                    permanent: showTooltip,
                                                    pane: 'popupPane',
                                                    label: e.name,
                                                })}
                                                TooltipComponent={MapToolTip}
                                                isCircle
                                            />
                                        </MarkerClusterGroup>
                                    </>
                                )}
                                {!useCluster && (
                                    <>
                                        <MarkersListComponent
                                            key={`markers-${subType.id}-${showTooltip}-${selectedChildren?.id}`}
                                            items={orgUnitsMarkers || []}
                                            markerProps={children => ({
                                                ...circleColorMarkerOptions(
                                                    children.id ===
                                                        selectedChildren?.id
                                                        ? selectedOrgUnitColor
                                                        : subType.color || '',
                                                ),
                                                radius: 12,
                                            })}
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
                                    </>
                                )}
                            </Pane>
                        </Box>
                    );
                })}
            </MapContainer>
        </Box>
    );
};
