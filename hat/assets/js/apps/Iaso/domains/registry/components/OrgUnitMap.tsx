import React, {
    FunctionComponent,
    useState,
    useRef,
    useCallback,
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
import { useSkipEffectOnMount, useSafeIntl } from 'bluesquare-components';
import { Box, useTheme } from '@material-ui/core';
// @ts-ignore
import L from 'leaflet';

import { TilesSwitch, Tile } from '../../../components/maps/tools/TileSwitch';
import { MapLegend, Legend } from '../../../components/maps/MapLegend';
import CircleMarkerComponent from '../../../components/maps/markers/CircleMarkerComponent';

import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../orgUnits/types/orgunitTypes';

import tiles from '../../../constants/mapTiles';
import { circleColorMarkerOptions, ZoomControl } from '../../../utils/mapUtils';

import MESSAGES from '../messages';

const defaultViewport = {
    center: [1, 20],
    zoom: 3.25,
};
const boundsOptions = {
    padding: [50, 50],
};
type Props = {
    orgUnit?: OrgUnit;
    isLoading: boolean;
    subOrgUnitTypes: OrgunitTypes;
    childrenOrgUnits: OrgUnit[];
};

export const OrgUnitMap: FunctionComponent<Props> = ({
    orgUnit,
    isLoading,
    subOrgUnitTypes,
    childrenOrgUnits,
}) => {
    const map: any = useRef();
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    const fitToBounds = useCallback(() => {
        let finalBounds;
        let shapesBounds;
        const locations: { latitude: number; longitude: number }[] = [];
        if (orgUnit?.geo_json) {
            shapesBounds = L.geoJSON(orgUnit.geo_json).getBounds();
            finalBounds = shapesBounds;
        }
        if (orgUnit?.latitude && orgUnit?.longitude) {
            locations.push(L.latLng(orgUnit.latitude, orgUnit.longitude));
            const locationsBounds = L.latLngBounds(locations);
            finalBounds = locationsBounds;
        }
        // TODO fit to children org unit too
        if (finalBounds) {
            try {
                map.current?.leafletElement.fitBounds(
                    finalBounds,
                    boundsOptions,
                );
            } catch (e) {
                console.warn(e);
            }
        }
    }, [orgUnit]);
    useSkipEffectOnMount(() => {
        if (orgUnit?.geo_json || (orgUnit?.latitude && orgUnit?.longitude)) {
            fitToBounds();
        }
    }, [orgUnit]);
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
                isLoading={isLoading}
                zoomSnap={0.25}
                maxZoom={currentTile.maxZoom}
                ref={map}
                style={{ height: '500px' }}
                center={defaultViewport.center}
                zoom={defaultViewport.zoom}
                scrollWheelZoom={false}
                zoomControl={false}
                contextmenu
            >
                <ZoomControl fitToBounds={() => fitToBounds()} />
                <ScaleControl imperial={false} />
                <TileLayer
                    attribution={currentTile.attribution ?? ''}
                    url={currentTile.url}
                />
                {orgUnit?.geo_json && (
                    <Pane name="orgunit-shapes">
                        <GeoJSON className="secondary" data={orgUnit.geo_json}>
                            <Tooltip>{orgUnit.name}</Tooltip>
                        </GeoJSON>
                    </Pane>
                )}
                {orgUnit?.latitude && orgUnit?.longitude && (
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
                {subOrgUnitTypes.map(subType => (
                    <Pane
                        name={`children-orgunit-type-${subType.id}`}
                        key={subType.id}
                    >
                        {childrenOrgUnits.map(childrenOrgUnit => {
                            if (
                                childrenOrgUnit.org_unit_type_id === subType.id
                            ) {
                                const { latitude, longitude, geo_json } =
                                    childrenOrgUnit;
                                if (geo_json) {
                                    return (
                                        <GeoJSON
                                            key={childrenOrgUnit.id}
                                            style={() => ({
                                                color: subType.color || '',
                                            })}
                                            data={childrenOrgUnit.geo_json}
                                        >
                                            <Tooltip>
                                                {childrenOrgUnit.name}
                                            </Tooltip>
                                        </GeoJSON>
                                    );
                                }
                                if (latitude && longitude) {
                                    return (
                                        <CircleMarkerComponent
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
                            }
                            return null;
                        })}
                    </Pane>
                ))}
            </Map>
        </Box>
    );
};
