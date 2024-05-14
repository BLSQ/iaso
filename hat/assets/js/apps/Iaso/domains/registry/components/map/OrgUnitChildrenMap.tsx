import { Box } from '@mui/material';
import { red } from '@mui/material/colors';
import { makeStyles } from '@mui/styles';
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
import { MapContainer, ScaleControl } from 'react-leaflet';
import { useDispatch } from 'react-redux';
import {
    getOrgUnitBounds,
    getOrgUnitsBounds,
    mergeBounds,
} from '../../../../utils/map/mapUtils';

import { Tile } from '../../../../components/maps/tools/TilesSwitchControl';
import { MapLegend } from './MapLegend';

import { OrgUnit } from '../../../orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../../orgUnits/types/orgunitTypes';
import { Legend, useGetlegendOptions } from '../../hooks/useGetLegendOptions';

import { MapToggleFullscreen } from './MapToggleFullscreen';

import { CustomTileLayer } from '../../../../components/maps/tools/CustomTileLayer';
import { CustomZoomControl } from '../../../../components/maps/tools/CustomZoomControl';
import TILES from '../../../../constants/mapTiles';
import { baseUrls } from '../../../../constants/urls';
import { redirectTo, redirectToReplace } from '../../../../routing/actions';
import { RegistryDetailParams } from '../../types';
import { MapSettings, Settings } from './MapSettings';
import { OrgUnitChildrenLocations } from './OrgUnitChildrenLocations';
import { OrgUnitChildrenShapes } from './OrgUnitChildrenShapes';
import { OrgUnitLocation } from './OrgUnitLocation';

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
                <OrgUnitLocation
                    showTooltip={showTooltip}
                    orgUnit={orgUnit}
                    isOrgUnitActive={isOrgUnitActive}
                    selectedChildren={selectedChildren}
                />
                {subOrgUnitTypes.map((subType, index) => (
                    <Box key={subType.id}>
                        <OrgUnitChildrenShapes
                            activeChildren={activeChildren}
                            showTooltip={showTooltip}
                            index={index}
                            subType={subType}
                            handleFeatureEvents={handleFeatureEvents}
                            selectedChildren={selectedChildren}
                        />
                        <OrgUnitChildrenLocations
                            activeChildren={activeChildren}
                            showTooltip={showTooltip}
                            useCluster={useCluster}
                            index={index}
                            subType={subType}
                            handleSingleClick={handleSingleClick}
                            handleDoubleClick={handleDoubleClick}
                            selectedChildren={selectedChildren}
                        />
                    </Box>
                ))}
            </MapContainer>
        </Box>
    );
};
