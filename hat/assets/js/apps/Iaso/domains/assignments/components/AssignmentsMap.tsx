import React, { FunctionComponent, useRef, useState, useEffect } from 'react';
import {
    Map,
    TileLayer,
    GeoJSON,
    Pane,
    Tooltip,
    ScaleControl,
} from 'react-leaflet';
import { Box } from '@material-ui/core';
import {
    // @ts-ignore
    LoadingSpinner,
} from 'bluesquare-components';

import { Locations, OrgUnitMarker, OrgUnitShape } from '../types/locations';

import { TilesSwitch, Tile } from '../../../components/maps/tools/TileSwitch';
import { MapLegend } from './MapLegend';
import MarkersListComponent from '../../../components/maps/markers/MarkersListComponent';

import { AlreadyAssigned } from './AlreadyAssigned';

import {
    disabledColor,
    unSelectedColor,
    parentColor,
} from '../constants/colors';
import tiles from '../../../constants/mapTiles';

import {
    ZoomControl,
    circleColorMarkerOptions,
    getShapesBounds,
    getLatLngBounds,
} from '../../../utils/mapUtils';

import { DropdownTeamsOptions } from '../types/team';

const defaultViewport = {
    center: [1, 20],
    zoom: 3.25,
};

type Props = {
    // eslint-disable-next-line no-unused-vars
    handleClick: (shape: OrgUnitShape | OrgUnitMarker) => void;
    // eslint-disable-next-line no-unused-vars
    handleParentClick: (shape: OrgUnitShape) => void;
    teams: DropdownTeamsOptions[];
    locations: Locations | undefined;
    isFetchingLocations: boolean;
    parentLocations: OrgUnitShape[] | undefined;
    isFetchingParentLocations: boolean;
};

const boundsOptions = {
    padding: [50, 50],
};

const getLocationsBounds = (
    locations: Locations,
    parentLocations: OrgUnitShape[] | undefined,
) => {
    const shapeBounds = locations
        ? getShapesBounds(locations.shapes.all, 'geoJson')
        : null;
    const locationsBounds = locations
        ? getLatLngBounds(locations.markers.all)
        : null;
    let bounds;
    let parentShapeBounds;
    if (parentLocations) {
        parentShapeBounds = getShapesBounds(parentLocations, 'geoJson');
    }
    if (locationsBounds && shapeBounds) {
        bounds = locationsBounds.extend(shapeBounds);
    } else if (locationsBounds) {
        bounds = locationsBounds;
    } else if (shapeBounds) {
        bounds = shapeBounds;
    }
    if (parentShapeBounds && bounds) {
        bounds = bounds.extend(parentShapeBounds);
    }
    return bounds;
};

export const AssignmentsMap: FunctionComponent<Props> = ({
    handleClick,
    handleParentClick,
    teams,
    locations,
    isFetchingLocations,
    parentLocations,
    isFetchingParentLocations,
}) => {
    const map: any = useRef();
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    const fitToBounds = (
        newLocations: Locations,
        newParentLocations: OrgUnitShape[] | undefined,
    ) => {
        const bounds = getLocationsBounds(newLocations, newParentLocations);
        if (bounds && map?.current) {
            try {
                map.current.leafletElement.fitBounds(bounds, boundsOptions);
            } catch (e) {
                console.warn(e);
            }
        }
    };

    useEffect(() => {
        if (!isFetchingLocations && !isFetchingParentLocations && locations) {
            fitToBounds(locations, parentLocations);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFetchingLocations, locations, isFetchingParentLocations]);

    const isLoading = isFetchingLocations || isFetchingParentLocations;
    return (
        <Box position="relative">
            <MapLegend />
            <TilesSwitch
                currentTile={currentTile}
                setCurrentTile={setCurrentTile}
            />
            {isLoading && <LoadingSpinner absolute />}
            <Map
                isLoading={isLoading}
                zoomSnap={0.25}
                maxZoom={currentTile.maxZoom}
                ref={map}
                style={{ height: '72vh' }}
                center={defaultViewport.center}
                zoom={defaultViewport.zoom}
                scrollWheelZoom={false}
                zoomControl={false}
            >
                <ScaleControl imperial={false} />
                <TileLayer
                    attribution={currentTile.attribution ?? ''}
                    url={currentTile.url}
                />
                {locations && (
                    <>
                        <ZoomControl
                            fitToBounds={() =>
                                fitToBounds(locations, parentLocations)
                            }
                        />
                        <Pane name="shapes-unselected-already-assigned">
                            {locations.shapes.unselected
                                .filter(
                                    shape => shape.otherAssignation.assignment,
                                )
                                .map(shape => {
                                    return (
                                        <GeoJSON
                                            key={shape.id}
                                            data={shape.geoJson}
                                            style={() => ({
                                                color: disabledColor,
                                                fillOpacity: 0.5,
                                            })}
                                        >
                                            <Tooltip>
                                                <AlreadyAssigned
                                                    item={shape}
                                                    teams={teams}
                                                />
                                            </Tooltip>
                                        </GeoJSON>
                                    );
                                })}
                        </Pane>
                        <Pane name="shapes-unselected">
                            {locations.shapes.unselected
                                .filter(
                                    shape => !shape.otherAssignation.assignment,
                                )
                                .map(shape => (
                                    <GeoJSON
                                        key={shape.id}
                                        onClick={() => handleClick(shape)}
                                        data={shape.geoJson}
                                        style={() => ({
                                            color: unSelectedColor,
                                        })}
                                    >
                                        <Tooltip>{shape.name}</Tooltip>
                                    </GeoJSON>
                                ))}
                        </Pane>
                        <Pane name="shapes-selected">
                            {locations.shapes.selected.map(shape => (
                                <GeoJSON
                                    key={shape.id}
                                    onClick={() => handleClick(shape)}
                                    data={shape.geoJson}
                                    style={() => ({
                                        color: shape.color,
                                        fillOpacity: 0.4,
                                    })}
                                >
                                    <Tooltip>{shape.name}</Tooltip>
                                </GeoJSON>
                            ))}
                        </Pane>
                        <Pane name="markers-unselected-already-assigned">
                            <MarkersListComponent
                                items={
                                    locations.markers.unselected.filter(
                                        marker =>
                                            marker.otherAssignation.assignment,
                                    ) || []
                                }
                                onMarkerClick={() => null}
                                markerProps={() => ({
                                    ...circleColorMarkerOptions(disabledColor),
                                })}
                                tooltipProps={orgUnit => {
                                    return {
                                        children: (
                                            <AlreadyAssigned
                                                item={orgUnit}
                                                teams={teams}
                                            />
                                        ),
                                    };
                                }}
                                TooltipComponent={Tooltip}
                                isCircle
                            />
                        </Pane>
                        <Pane name="markers-unselected">
                            <MarkersListComponent
                                items={
                                    locations.markers.unselected.filter(
                                        marker =>
                                            !marker.otherAssignation.assignment,
                                    ) || []
                                }
                                onMarkerClick={shape => handleClick(shape)}
                                markerProps={() => ({
                                    ...circleColorMarkerOptions(
                                        unSelectedColor,
                                    ),
                                })}
                                tooltipProps={orgUnit => ({
                                    children: [orgUnit.name],
                                })}
                                TooltipComponent={Tooltip}
                                isCircle
                            />
                        </Pane>
                        <Pane name="markers-selected">
                            <MarkersListComponent
                                items={locations.markers.selected || []}
                                onMarkerClick={shape => handleClick(shape)}
                                markerProps={shape => ({
                                    ...circleColorMarkerOptions(shape.color),
                                })}
                                tooltipProps={orgUnit => ({
                                    children: [orgUnit.name],
                                })}
                                TooltipComponent={Tooltip}
                                isCircle
                            />
                        </Pane>
                        {parentLocations && (
                            <Pane name="parent-shapes">
                                {parentLocations.map(shape => (
                                    <GeoJSON
                                        key={shape.id}
                                        onClick={() => handleParentClick(shape)}
                                        data={shape.geoJson}
                                        style={() => ({
                                            color: parentColor,
                                            fillOpacity: '0',
                                        })}
                                    >
                                        <Tooltip>{shape.name}</Tooltip>
                                    </GeoJSON>
                                ))}
                            </Pane>
                        )}
                    </>
                )}
            </Map>
        </Box>
    );
};
