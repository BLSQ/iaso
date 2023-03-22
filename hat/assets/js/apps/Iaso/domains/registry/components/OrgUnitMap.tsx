import React, { FunctionComponent, useState, useRef, useCallback } from 'react';
import {
    Map,
    TileLayer,
    GeoJSON,
    Pane,
    ScaleControl,
    Tooltip,
} from 'react-leaflet';
import { useSkipEffectOnMount } from 'bluesquare-components';
import { Box, useTheme } from '@material-ui/core';
// @ts-ignore
import L from 'leaflet';

import { TilesSwitch, Tile } from '../../../components/maps/tools/TileSwitch';
import { MapLegend } from '../../../components/maps/MapLegend';

import { OrgUnit } from '../../orgUnits/types/orgUnit';

import tiles from '../../../constants/mapTiles';
import { OrgunitTypes } from '../../orgUnits/types/orgunitTypes';

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
    const theme = useTheme();
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    const fitToBounds = useCallback(() => {
        let newBounds;
        if (orgUnit?.geo_json) {
            newBounds = L.geoJSON(orgUnit.geo_json).getBounds();
        }
        if (newBounds) {
            try {
                map.current?.leafletElement.fitBounds(newBounds, boundsOptions);
            } catch (e) {
                console.warn(e);
            }
        }
    }, [orgUnit]);
    useSkipEffectOnMount(() => {
        if (orgUnit?.geo_json) {
            fitToBounds();
        }
    }, [orgUnit?.geo_json]);
    return (
        <Box position="relative">
            <MapLegend
                top="auto"
                bottom={theme.spacing(3)}
                width="auto"
                padding={2}
                options={subOrgUnitTypes.map(subOuType => ({
                    value: `${subOuType.id}`,
                    label: subOuType.name,
                    color: subOuType.color || '',
                }))}
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
                {subOrgUnitTypes.map(subType => (
                    <Pane name={`children-orgunit-type-${subType.id}`}>
                        {childrenOrgUnits.map(childrenOrgUnit => {
                            if (
                                childrenOrgUnit.org_unit_type_id === subType.id
                            ) {
                                if (childrenOrgUnit.geo_json) {
                                    return (
                                        <GeoJSON
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
                            }
                            return null;
                        })}
                    </Pane>
                ))}
            </Map>
        </Box>
    );
};
