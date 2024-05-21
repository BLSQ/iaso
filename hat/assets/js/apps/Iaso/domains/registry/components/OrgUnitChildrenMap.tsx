import { Box } from '@mui/material';
import { red } from '@mui/material/colors';
import { makeStyles } from '@mui/styles';
import {
    LoadingSpinner,
    commonStyles,
    useRedirectTo,
    useRedirectToReplace,
} from 'bluesquare-components';
import classNames from 'classnames';
import L from 'leaflet';
import { keyBy } from 'lodash';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { GeoJSON, MapContainer, Pane, ScaleControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
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
import { RegistryDetailParams } from '../types';
import { MapPopUp } from './MapPopUp';
import { MapSettings, Settings } from './MapSettings';
import { MapToolTip } from './MapTooltip';

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
}) => {
    const classes: Record<string, string> = useStyles();
    const redirectToReplace = useRedirectToReplace();
    const redirectTo = useRedirectTo();
    const [settings, setSettings] = useState<Settings>({
        showTooltip: params.showTooltip === 'true',
        useCluster: params.useCluster === 'true',
    });

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
            redirectToReplace(baseUrls.registry, {
                ...params,
                [setting]: `${newSetting}`,
            });
        },
        [params, redirectToReplace, settings],
    );

    const handleToggleFullScreen = useCallback(
        (isFull: boolean) => {
            setIsMapFullScreen(isFull);
            redirectToReplace(baseUrls.registry, {
                ...params,
                isFullScreen: `${isFull}`,
            });
        },
        [params, redirectToReplace],
    );
    const handleDoubleClick = useCallback(
        (event: L.LeafletMouseEvent, ou: OrgUnit) => {
            event.originalEvent.stopPropagation();
            const url = `/${baseUrls.registry}/orgUnitId/${ou?.id}`;
            redirectTo(url);
        },
        [redirectTo],
    );

    const handleFeatureDoubleClick = useCallback(
        (ou: OrgUnit) => (_, layer) => {
            layer.on('dblclick', event => handleDoubleClick(event, ou));
        },
        [handleDoubleClick],
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
                            <Pane name="orgunit-shapes">
                                <GeoJSON
                                    data={orgUnit.geo_json}
                                    style={() => ({
                                        color: selectedOrgUnitColor,
                                    })}
                                >
                                    <MapPopUp orgUnit={orgUnit} />
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
                                        selectedOrgUnitColor,
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
                                PopupComponent={MapPopUp}
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
                                style={{ zIndex: 400 + index }}
                            >
                                {orgUnitsShapes.map(childrenOrgUnit => (
                                    <GeoJSON
                                        key={childrenOrgUnit.id}
                                        onEachFeature={handleFeatureDoubleClick(
                                            childrenOrgUnit,
                                        )}
                                        style={() => ({
                                            color: subType.color || '',
                                        })}
                                        data={childrenOrgUnit.geo_json}
                                    >
                                        <MapPopUp orgUnit={childrenOrgUnit} />
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
                                                key={`markers-${subType.id}-${showTooltip}`}
                                                items={orgUnitsMarkers || []}
                                                markerProps={() => ({
                                                    ...circleColorMarkerOptions(
                                                        subType.color || '',
                                                    ),
                                                    radius: 12,
                                                })}
                                                popupProps={location => ({
                                                    orgUnit: location,
                                                })}
                                                onDblclick={handleDoubleClick}
                                                tooltipProps={e => ({
                                                    permanent: showTooltip,
                                                    pane: 'popupPane',
                                                    label: e.name,
                                                })}
                                                PopupComponent={MapPopUp}
                                                TooltipComponent={MapToolTip}
                                                isCircle
                                            />
                                        </MarkerClusterGroup>
                                    </>
                                )}
                                {!useCluster && (
                                    <>
                                        <MarkersListComponent
                                            key={`markers-${subType.id}-${showTooltip}`}
                                            items={orgUnitsMarkers || []}
                                            markerProps={() => ({
                                                ...circleColorMarkerOptions(
                                                    subType.color || '',
                                                ),
                                                radius: 12,
                                            })}
                                            popupProps={location => ({
                                                orgUnit: location,
                                            })}
                                            onDblclick={handleDoubleClick}
                                            tooltipProps={e => ({
                                                permanent: showTooltip,
                                                pane: 'popupPane',
                                                label: e.name,
                                            })}
                                            PopupComponent={MapPopUp}
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
