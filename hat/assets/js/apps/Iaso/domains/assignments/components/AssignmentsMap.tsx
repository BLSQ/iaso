import React, { FunctionComponent, useRef, useState, useEffect } from 'react';
import { UseQueryResult } from 'react-query';
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
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

import { Locations, OrgUnitMarker, OrgUnitShape } from '../types/locations';

import { TilesSwitch, Tile } from '../../../components/maps/tools/TileSwitch';
import MarkersListComponent from '../../../components/maps/markers/MarkersListComponent';

import { disabledColor, unSelectedColor } from '../constants/colors';
import tiles from '../../../constants/mapTiles';

import {
    ZoomControl,
    circleColorMarkerOptions,
    getShapesBounds,
    getLatLngBounds,
} from '../../../utils/mapUtils';
import { getDisplayName } from '../../../utils/usersUtils';
import { getParentTeam } from '../utils';

import { DropdownTeamsOptions } from '../types/team';
import { IntlFormatMessage } from '../../../types/intl';

import MESSAGES from '../messages';

const defaultViewport = {
    center: [1, 20],
    zoom: 3.25,
};

type Props = {
    // eslint-disable-next-line no-unused-vars
    handleClick: (shape: OrgUnitShape | OrgUnitMarker) => void;
    getLocations: UseQueryResult<Locations, Error>;
    teams: DropdownTeamsOptions[];
};

const boundsOptions = {
    padding: [50, 50],
};

const getLocationsBounds = (locations: Locations) => {
    const shapeBounds = locations
        ? getShapesBounds(locations.shapes.all, 'geoJson')
        : null;
    const locationsBounds = locations
        ? getLatLngBounds(locations.markers.all)
        : null;
    let bounds = null;
    if (locationsBounds && shapeBounds) {
        bounds = locationsBounds.extend(shapeBounds);
    } else if (locationsBounds) {
        bounds = locationsBounds;
    } else if (shapeBounds) {
        bounds = shapeBounds;
    }
    return bounds;
};

const getAlreadyAssignedText = (
    item: OrgUnitShape | OrgUnitMarker,
    formatMessage: IntlFormatMessage,
    teams: DropdownTeamsOptions[],
) => {
    let otherAssignString = '';
    let parentTeam;
    if (item.otherAssignation.assignedTeam) {
        parentTeam = getParentTeam({
            currentTeam: item.otherAssignation.assignedTeam,
            teams,
        });
        otherAssignString = item.otherAssignation.assignedTeam.label;
    }
    if (item.otherAssignation.assignedUser) {
        parentTeam = getParentTeam({
            currentUser: item.otherAssignation.assignedUser,
            teams,
        });
        otherAssignString = getDisplayName(item.otherAssignation.assignedUser);
    }
    return (
        <>
            {`${item.name} ${formatMessage(
                MESSAGES.alreadyAssignedTo,
            )} ${otherAssignString} ${formatMessage(MESSAGES.inAnotherTeam)}${
                parentTeam && ` (${parentTeam.label})`
            }`}
        </>
    );
};

export const AssignmentsMap: FunctionComponent<Props> = ({
    handleClick,
    getLocations,
    teams,
}) => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const map: any = useRef();
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    const fitToBounds = (newLocations: Locations) => {
        const bounds = getLocationsBounds(newLocations);
        if (bounds && map?.current) {
            try {
                map.current.leafletElement.fitBounds(bounds, boundsOptions);
            } catch (e) {
                console.warn(e);
            }
        }
    };
    const { data: locations, isFetching: isFetchingLocations } = getLocations;

    useEffect(() => {
        if (!isFetchingLocations && locations) {
            fitToBounds(locations);
        }
    }, [isFetchingLocations, locations]);
    return (
        <Box position="relative">
            <TilesSwitch
                currentTile={currentTile}
                setCurrentTile={setCurrentTile}
            />
            {isFetchingLocations && <LoadingSpinner absolute />}
            <Map
                isLoading={isFetchingLocations}
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
                            fitToBounds={() => fitToBounds(locations)}
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
                                            })}
                                        >
                                            <Tooltip>
                                                {getAlreadyAssignedText(
                                                    shape,
                                                    formatMessage,
                                                    teams,
                                                )}
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
                                            <>
                                                {getAlreadyAssignedText(
                                                    orgUnit,
                                                    formatMessage,
                                                    teams,
                                                )}
                                            </>
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
                                    children: [orgUnit.name, 'sa mere'],
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
                    </>
                )}
            </Map>
        </Box>
    );
};
