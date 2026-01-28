import React, {
    Dispatch,
    FunctionComponent,
    SetStateAction,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { Box } from '@mui/material';
import { red } from '@mui/material/colors';
import { makeStyles } from '@mui/styles';
import {
    LoadingSpinner,
    commonStyles,
    useRedirectToReplace,
} from 'bluesquare-components';
import classNames from 'classnames';
import L from 'leaflet';
import { keyBy } from 'lodash';
import { MapContainer, ScaleControl } from 'react-leaflet';

import { CustomTileLayer } from '../../../../components/maps/tools/CustomTileLayer';
import { CustomZoomControl } from '../../../../components/maps/tools/CustomZoomControl';
import { Tile } from '../../../../components/maps/tools/TilesSwitchControl';
import TILES from '../../../../constants/mapTiles';
import { baseUrls } from '../../../../constants/urls';
import { useObjectState } from '../../../../hooks/useObjectState';
import {
    getOrgUnitBounds,
    getOrgUnitsBounds,
    mergeBounds,
} from '../../../../utils/map/mapUtils';
import { OrgUnit } from '../../../orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../../orgUnits/types/orgunitTypes';
import { HEIGHT } from '../../config';
import { useGetLegendOptions } from '../../hooks/useGetLegendOptions';
import { RegistryParams } from '../../types';
import { MapLegend } from './MapLegend';
import { MapSettings } from './MapSettings';
import { MapToggleFullscreen } from './MapToggleFullscreen';
import { OrgUnitChildrenLocations } from './OrgUnitChildrenLocations';
import { OrgUnitChildrenShapes } from './OrgUnitChildrenShapes';
import { OrgUnitLocation } from './OrgUnitLocation';

type Props = {
    orgUnit: OrgUnit;
    subOrgUnitTypes: OrgunitTypes;
    orgUnitChildren?: OrgUnit[];
    isFetchingChildren: boolean;
    params: RegistryParams;
    setSelectedChildren: Dispatch<SetStateAction<OrgUnit | undefined>>;
    selectedChildrenId: string | undefined;
    isFetchingOrgUnit: boolean;
    handleOrgUnitChange: (newOrgUnit: OrgUnit) => void;
};

const boundsOptions: L.FitBoundsOptions = {
    padding: L.point(50, 50),
};
const tabsHeight = '50px';
const mapHeight = `calc(${HEIGHT} - ${tabsHeight})`;
const mapHeightFullScreen = `calc(92vh - ${tabsHeight})`;
const useStyles = makeStyles(theme => ({
    mapContainer: {
        ...commonStyles(theme).mapContainer,
        height: mapHeight,
        marginBottom: 0,
        position: 'relative',
        '& .leaflet-control-zoom': {
            borderBottom: 'none',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
        },
    },
    fullScreen: {
        position: 'fixed',
        top: '127px',
        left: '0',
        width: '100vw',
        height: 'calc(100vh - 127px)',
        zIndex: 1300,
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
    selectedChildrenId,
    isFetchingOrgUnit,
    handleOrgUnitChange,
}) => {
    const classes: Record<string, string> = useStyles();

    const redirectToReplace = useRedirectToReplace();

    const [settings, setSettings] = useObjectState({
        showTooltip: params.showTooltip === 'true',
        clusterEnabled: params.clusterEnabled === 'true',
    });
    const [isMapFullScreen, setIsMapFullScreen] = useState<boolean>(
        params.fullScreen === 'true',
    );
    const [currentTile, setCurrentTile] = useState<Tile>(TILES.osm);
    const { legendOptions, setLegendOptions } = useGetLegendOptions(
        orgUnit,
        subOrgUnitTypes,
        selectedChildrenId,
    );
    const legendOptionsMap = keyBy(legendOptions, 'value');
    const activeChildren: OrgUnit[] = useMemo(() => {
        return (
            orgUnitChildren?.filter(
                child => legendOptionsMap[child.org_unit_type_id]?.active,
            ) || []
        );
    }, [orgUnitChildren, legendOptionsMap]);
    const isOrgUnitActive = Boolean(legendOptions[0]?.active);
    const { showTooltip, clusterEnabled } = settings;
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
            setSettings({
                [setting]: newSetting,
            });

            redirectToReplace(baseUrls.registry, {
                ...params,
                [setting]: `${newSetting}`,
            });
        },
        [params, redirectToReplace, setSettings, settings],
    );

    const handleToggleFullScreen = useCallback(
        (isFull: boolean) => {
            setIsMapFullScreen(isFull);
            redirectToReplace(baseUrls.registry, {
                ...params,
                fullScreen: `${isFull}`,
            });
        },
        [params, redirectToReplace],
    );
    const handleDoubleClick = useCallback(
        (event: L.LeafletMouseEvent, ou: OrgUnit) => {
            event.originalEvent.stopPropagation();
            handleOrgUnitChange(ou);
        },
        [handleOrgUnitChange],
    );
    const handleSingleClick = useCallback(
        (ou: OrgUnit, event: L.LeafletMouseEvent | undefined) => {
            event?.originalEvent.stopPropagation();
            setSelectedChildren(ou.id === orgUnit.id ? undefined : ou);
        },
        [orgUnit, setSelectedChildren],
    );

    const handleFeatureEvents = useCallback(
        (ou: OrgUnit) => (_, layer) => {
            layer.on('dblclick', event => handleDoubleClick(event, ou));
            layer.on('click', event => handleSingleClick(ou, event));
        },
        [handleDoubleClick, handleSingleClick],
    );
    return (
        <Box
            className={classNames(
                classes.mapContainer,
                isMapFullScreen && classes.fullScreen,
            )}
        >
            {(isFetchingChildren || isFetchingOrgUnit) && (
                <LoadingSpinner absolute />
            )}
            <MapLegend options={legendOptions} setOptions={setLegendOptions} />
            <Box className="map">
                <MapContainer
                    doubleClickZoom={false}
                    maxZoom={currentTile.maxZoom}
                    style={{
                        minHeight: isMapFullScreen
                            ? mapHeightFullScreen
                            : mapHeight,
                        height: '100%',
                    }}
                    center={[1, 20]}
                    zoom={3}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    bounds={bounds}
                    boundsOptions={boundsOptions}
                    trackResize
                    key={`${params.orgUnitId}-${params.fullScreen}`}
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
                        triggerFitToBoundsId={`${params.orgUnitId}-${isFetchingOrgUnit}-${params.fullScreen}`}
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
                        selectedChildrenId={selectedChildrenId}
                        handleSingleClick={handleSingleClick}
                        handleFeatureEvents={handleFeatureEvents}
                    />
                    {subOrgUnitTypes.map((subType, index) => (
                        <Box key={subType.id}>
                            <OrgUnitChildrenShapes
                                activeChildren={activeChildren}
                                showTooltip={showTooltip}
                                index={index}
                                subType={subType}
                                handleFeatureEvents={handleFeatureEvents}
                                selectedChildrenId={selectedChildrenId}
                            />
                            <OrgUnitChildrenLocations
                                activeChildren={activeChildren}
                                showTooltip={showTooltip}
                                clusterEnabled={clusterEnabled}
                                index={index}
                                subType={subType}
                                handleSingleClick={handleSingleClick}
                                handleDoubleClick={handleDoubleClick}
                                selectedChildrenId={selectedChildrenId}
                            />
                        </Box>
                    ))}
                </MapContainer>
            </Box>
        </Box>
    );
};
