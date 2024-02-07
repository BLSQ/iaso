import React, { FunctionComponent, useRef, useState, useMemo } from 'react';
import {
    MapContainer,
    GeoJSON,
    Pane,
    Tooltip,
    ScaleControl,
} from 'react-leaflet';

import { Box } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';

import { Locations, OrgUnitMarker, OrgUnitShape } from '../types/locations';

import { Tile } from '../../../components/maps/tools/TilesSwitchControl';
import { MapLegend } from './MapLegend';
import { MapInfo } from './MapInfo';
import MarkersListComponent from '../../../components/maps/markers/MarkersListComponent';
import { OrgUnitPopup } from './OrgUnitPopup';

import {
    disabledColor,
    unSelectedColor,
    parentColor,
} from '../constants/colors';
import tiles from '../../../constants/mapTiles';

import {
    Bounds,
    circleColorMarkerOptions,
    getShapesBounds,
    getLatLngBounds,
} from '../../../utils/map/mapUtils';
import { Profile } from '../../../utils/usersUtils';

import { DropdownTeamsOptions } from '../types/team';
import { AssignmentsApi } from '../types/assigment';
import { CustomZoomControl } from '../../../components/maps/tools/CustomZoomControl';
import { CustomTileLayer } from '../../../components/maps/tools/CustomTileLayer';

const defaultViewport = {
    center: [1, 20],
    zoom: 3.25,
};

type AnchorPoint = { x: number; y: number };

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
    assignments: AssignmentsApi;
    profiles: Profile[];
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
    assignments,
    profiles,
}) => {
    const mapContainer: any = useRef();
    const [selectedLocation, setSelectedLocation] = useState<
        OrgUnitShape | OrgUnitMarker | undefined
    >(undefined);
    const [popupPosition, sePopupPosition] = useState<
        'top' | 'bottom' | 'left'
    >('bottom');
    const [anchorPoint, setAnchorPoint] = useState<AnchorPoint>({
        x: 0,
        y: 0,
    });
    const [
        selectedLocationAlreadyeAssigned,
        setSelectedLocationAlreadyeAssigned,
    ] = useState<boolean>(false);
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);

    const bounds: Bounds | undefined = useMemo(
        () => locations && getLocationsBounds(locations, parentLocations),
        [locations, parentLocations],
    );

    const onClick = (selecteOrgunit: OrgUnitShape | OrgUnitMarker) => {
        if (!selectedLocation) {
            handleClick(selecteOrgunit);
        }
    };

    const onParentClick = (selecteOrgunit: OrgUnitShape) => {
        if (!selectedLocation) {
            handleParentClick(selecteOrgunit);
        }
    };

    const handleContextMenu = (
        event,
        selectedItem: OrgUnitShape | OrgUnitMarker,
        isAlreadyAssigned: boolean,
    ) => {
        const offset = 200;
        let position: 'top' | 'bottom' | 'left' = 'bottom';
        if (window.innerHeight - event.originalEvent.pageY < offset) {
            position = 'top';
        }
        if (window.innerWidth - event.originalEvent.pageX < offset) {
            position = 'left';
        }
        sePopupPosition(position);
        setSelectedLocationAlreadyeAssigned(isAlreadyAssigned);
        setAnchorPoint({
            x: event.containerPoint.x,
            y: event.containerPoint.y,
        });
        setSelectedLocation(selectedItem);
    };

    const onEachFeature = (layer, selectedItem, isAlreadyAssigned = false) => {
        layer.on({
            contextmenu: event =>
                handleContextMenu(event, selectedItem, isAlreadyAssigned),
        });
    };

    const isLoading = isFetchingLocations || isFetchingParentLocations;
    const markersColors = useMemo(
        () =>
            (locations?.markers.selected || [])
                .map(marker => `${marker.color}_${marker.id}`)
                .join('-'),
        [locations?.markers.selected],
    );
    return (
        <section ref={mapContainer}>
            <Box position="relative">
                <MapLegend />
                <MapInfo />
                {selectedLocation && (
                    <OrgUnitPopup
                        top={anchorPoint.y}
                        left={anchorPoint.x}
                        closePopup={() => setSelectedLocation(undefined)}
                        location={selectedLocation}
                        alreadyAssigned={selectedLocationAlreadyeAssigned}
                        teams={teams}
                        profiles={profiles}
                        assignments={assignments}
                        popupPosition={popupPosition}
                    />
                )}
                {isLoading && <LoadingSpinner absolute />}
                <MapContainer
                    doubleClickZoom
                    isLoading={isLoading}
                    maxZoom={currentTile.maxZoom}
                    style={{ height: '72vh' }}
                    bounds={bounds}
                    boundsOptions={boundsOptions}
                    center={defaultViewport.center}
                    zoom={defaultViewport.zoom}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    contextmenu
                    onMovestart={() => setSelectedLocation(undefined)}
                >
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
                    {locations && (
                        <>
                            <Pane name="shapes-unselected-already-assigned">
                                {locations.shapes.unselected
                                    .filter(
                                        shape =>
                                            shape.otherAssignation?.assignment,
                                    )
                                    .map(shape => {
                                        return (
                                            <GeoJSON
                                                onEachFeature={(_, layer) =>
                                                    onEachFeature(
                                                        layer,
                                                        shape,
                                                        true,
                                                    )
                                                }
                                                key={shape.id}
                                                data={shape.geoJson}
                                                style={() => ({
                                                    color: disabledColor,
                                                    fillOpacity: 0.5,
                                                })}
                                            />
                                        );
                                    })}
                            </Pane>
                            <Pane name="shapes-unselected">
                                {locations.shapes.unselected
                                    .filter(
                                        shape =>
                                            !shape.otherAssignation?.assignment,
                                    )
                                    .map(shape => (
                                        <GeoJSON
                                            onEachFeature={(_, layer) =>
                                                onEachFeature(layer, shape)
                                            }
                                            eventHandlers={{
                                                click: () => onClick(shape),
                                            }}
                                            key={shape.id}
                                            data={shape.geoJson}
                                            style={() => ({
                                                color: unSelectedColor,
                                            })}
                                        />
                                    ))}
                            </Pane>
                            <Pane name="shapes-selected">
                                {locations.shapes.selected.map(shape => (
                                    <GeoJSON
                                        onEachFeature={(_, layer) =>
                                            onEachFeature(layer, shape)
                                        }
                                        key={shape.id}
                                        eventHandlers={{
                                            click: () => onClick(shape),
                                        }}
                                        data={shape.geoJson}
                                        style={() => ({
                                            color: shape.color,
                                            fillOpacity: 0.4,
                                        })}
                                    />
                                ))}
                            </Pane>
                            <Pane name="markers-unselected-already-assigned">
                                <MarkersListComponent
                                    items={
                                        locations.markers.unselected.filter(
                                            marker =>
                                                marker.otherAssignation
                                                    ?.assignment,
                                        ) || []
                                    }
                                    onMarkerClick={() => null}
                                    markerProps={() => ({
                                        ...circleColorMarkerOptions(
                                            disabledColor,
                                        ),
                                    })}
                                    onContextmenu={(event, marker) =>
                                        handleContextMenu(event, marker, true)
                                    }
                                    isCircle
                                />
                            </Pane>
                            <Pane name="markers-unselected">
                                <MarkersListComponent
                                    items={
                                        locations.markers.unselected.filter(
                                            marker =>
                                                !marker.otherAssignation
                                                    ?.assignment,
                                        ) || []
                                    }
                                    onMarkerClick={shape => onClick(shape)}
                                    markerProps={() => ({
                                        ...circleColorMarkerOptions(
                                            unSelectedColor,
                                        ),
                                    })}
                                    onContextmenu={(event, marker) =>
                                        handleContextMenu(event, marker, false)
                                    }
                                    isCircle
                                />
                            </Pane>
                            <Pane name="markers-selected">
                                <MarkersListComponent
                                    key={markersColors}
                                    items={locations.markers.selected || []}
                                    onMarkerClick={marker => onClick(marker)}
                                    markerProps={marker => ({
                                        ...circleColorMarkerOptions(
                                            marker.color,
                                        ),
                                    })}
                                    onContextmenu={(event, marker) =>
                                        handleContextMenu(event, marker, false)
                                    }
                                    isCircle
                                />
                            </Pane>
                            {parentLocations && (
                                <Pane name="parent-shapes">
                                    {parentLocations.map(shape => (
                                        <GeoJSON
                                            key={shape.id}
                                            eventHandlers={{
                                                click: () =>
                                                    onParentClick(shape),
                                            }}
                                            data={shape.geoJson}
                                            style={{
                                                color: parentColor,
                                                fillOpacity: '0',
                                            }}
                                        >
                                            <Tooltip pane="popupPane">
                                                {shape.name}
                                            </Tooltip>
                                        </GeoJSON>
                                    ))}
                                </Pane>
                            )}
                        </>
                    )}
                </MapContainer>
            </Box>
        </section>
    );
};
