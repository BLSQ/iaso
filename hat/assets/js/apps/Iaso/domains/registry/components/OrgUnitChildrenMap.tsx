import React, {
    FunctionComponent,
    useState,
    useRef,
    useCallback,
    useMemo,
    useEffect,
} from 'react';
import {
    Map,
    TileLayer,
    GeoJSON,
    Pane,
    ScaleControl,
    Tooltip,
} from 'react-leaflet';
import { useSafeIntl } from 'bluesquare-components';
import { Box, useTheme } from '@material-ui/core';

import { TilesSwitch, Tile } from '../../../components/maps/tools/TileSwitch';
import { MapLegend, Legend } from '../../../components/maps/MapLegend';
import CircleMarkerComponent from '../../../components/maps/markers/CircleMarkerComponent';

import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../orgUnits/types/orgunitTypes';

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

import MESSAGES from '../messages';
import { MapPopUp } from './MapPopUp';

type Props = {
    orgUnit: OrgUnit;
    subOrgUnitTypes: OrgunitTypes;
    childrenOrgUnits: OrgUnit[];
};

export const OrgUnitChildrenMap: FunctionComponent<Props> = ({
    orgUnit,
    subOrgUnitTypes,
    childrenOrgUnits,
}) => {
    const map: any = useRef();
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();
    const [currentTile, setCurrentTile] = useState<Tile>(TILES.osm);
    const fitToBounds = useCallback(() => {
        const bounds: Bounds | undefined = mergeBounds(
            getOrgUnitBounds(orgUnit),
            getOrgUnitsBounds(childrenOrgUnits),
        );
        tryFitToBounds(bounds, map.current);
    }, [childrenOrgUnits, orgUnit]);

    useEffect(() => {
        fitToBounds();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const legendOptions: Legend[] = useMemo(() => {
        const options = subOrgUnitTypes.map(subOuType => ({
            value: `${subOuType.id}`,
            label: subOuType.name,
            color: subOuType.color || '',
        }));
        if (orgUnit) {
            options.unshift({
                value: `${orgUnit.id}`,
                label: formatMessage(MESSAGES.selectedOrgUnit),
                color: theme.palette.secondary.main,
            });
        }
        return options;
    }, [formatMessage, orgUnit, subOrgUnitTypes, theme.palette.secondary.main]);

    return (
        <Box position="relative">
            <MapLegend
                top="auto"
                bottom={theme.spacing(3)}
                width="auto"
                padding={2}
                options={legendOptions}
            />
            <TilesSwitch
                currentTile={currentTile}
                setCurrentTile={setCurrentTile}
            />
            <Map
                zoomSnap={0.25}
                maxZoom={currentTile.maxZoom}
                ref={map}
                style={{ height: '500px' }}
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
                {subOrgUnitTypes.map((subType, index) => (
                    <Box key={subType.id}>
                        <Pane
                            name={`children-shapes-orgunit-type-${subType.id}`}
                            style={{ zIndex: 400 + index }}
                        >
                            {childrenOrgUnits
                                .filter(childrenOrgUnit =>
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
                            {childrenOrgUnits
                                .filter(childrenOrgUnit =>
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
