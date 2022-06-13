import React, { FunctionComponent, useRef, useState } from 'react';
import { Map, TileLayer, GeoJSON, Pane, Tooltip } from 'react-leaflet';
import { Box } from '@material-ui/core';
import { useTheme, Theme } from '@material-ui/core/styles';
import {
    // @ts-ignore
    LoadingSpinner,
} from 'bluesquare-components';
// utils
import {
    ZoomControl,
    circleColorMarkerOptions,
    getShapesBounds,
    getLatLngBounds,
} from '../../../utils/mapUtils';
// constants
import tiles from '../../../constants/mapTiles';
// types
import { AssignmentsApi } from '../types/assigment';
import { Planning } from '../types/planning';
import { Locations, OrgUnitMarker, OrgUnitShape } from '../types/locations';
// requests
import { useGetOrgUnitLocations } from '../hooks/requests/useGetOrgUnitLocations';
// components
import { TilesSwitch, Tile } from '../../../components/maps/tools/TileSwitch';
import MarkersListComponent from '../../../components/maps/markers/MarkersListComponent';

const defaultViewport = {
    center: [1, 20],
    zoom: 3.25,
};

type Props = {
    assignments: AssignmentsApi;
    planning: Planning | undefined;
};
const boundsOptions = {
    padding: [50, 50],
};

const getLocationsBounds = (locations: Locations) => {
    const shapeBounds = locations
        ? getShapesBounds(locations.shapes, 'geoJson')
        : null;
    const locationsBounds = locations
        ? getLatLngBounds(locations.markers)
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

const getLocationColor = (
    assignments: AssignmentsApi,
    orgUnit: OrgUnitShape | OrgUnitMarker,
    theme: Theme,
): string => {
    if (assignments.some(assignment => assignment.org_unit === orgUnit.id)) {
        return 'red';
    }
    return theme.palette.grey[500];
};
export const AssignmentsMap: FunctionComponent<Props> = ({
    assignments,
    planning,
}) => {
    const map: any = useRef();
    const theme: Theme = useTheme();
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
    const { data: locations, isFetching: isFetchingLocations } =
        useGetOrgUnitLocations(planning?.org_unit, fitToBounds);
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
                <TileLayer
                    attribution={currentTile.attribution ?? ''}
                    url={currentTile.url}
                />
                {locations && (
                    <>
                        <ZoomControl
                            fitToBounds={() => fitToBounds(locations)}
                        />
                        <Pane name="shapes">
                            {locations.shapes.map(shape => (
                                <GeoJSON
                                    key={shape.id}
                                    data={shape.geoJson}
                                    style={() => ({
                                        color: getLocationColor(
                                            assignments,
                                            shape,
                                            theme,
                                        ),
                                    })}
                                >
                                    <Tooltip>{shape.name}</Tooltip>
                                </GeoJSON>
                            ))}
                        </Pane>
                        <Pane name="markers">
                            <MarkersListComponent
                                items={locations.markers || []}
                                // eslint-disable-next-line no-console
                                onMarkerClick={() => console.log('click')}
                                markerProps={shape => ({
                                    ...circleColorMarkerOptions(
                                        getLocationColor(
                                            assignments,
                                            shape,
                                            theme,
                                        ),
                                    ),
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
