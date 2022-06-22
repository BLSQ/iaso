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
} from 'bluesquare-components';

import {
    ZoomControl,
    circleColorMarkerOptions,
    getShapesBounds,
    getLatLngBounds,
} from '../../../utils/mapUtils';
import tiles from '../../../constants/mapTiles';
import { Locations, OrgUnitMarker, OrgUnitShape } from '../types/locations';
import { TilesSwitch, Tile } from '../../../components/maps/tools/TileSwitch';
import MarkersListComponent from '../../../components/maps/markers/MarkersListComponent';

const defaultViewport = {
    center: [1, 20],
    zoom: 3.25,
};

type Props = {
    // eslint-disable-next-line no-unused-vars
    handleClick: (shape: OrgUnitShape | OrgUnitMarker) => void;
    // eslint-disable-next-line no-unused-vars
    getLocationColor: (location: OrgUnitShape | OrgUnitMarker) => string;
    getLocations: UseQueryResult<Locations, Error>;
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

export const AssignmentsMap: FunctionComponent<Props> = ({
    handleClick,
    getLocationColor,
    getLocations,
}) => {
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
                        <Pane name="shapes">
                            {locations.shapes.map(shape => (
                                <GeoJSON
                                    key={shape.id}
                                    onClick={() => handleClick(shape)}
                                    data={shape.geoJson}
                                    style={() => ({
                                        color: getLocationColor(shape),
                                    })}
                                >
                                    <Tooltip>{shape.name}</Tooltip>
                                </GeoJSON>
                            ))}
                        </Pane>
                        <Pane name="markers">
                            <MarkersListComponent
                                items={locations.markers || []}
                                onMarkerClick={shape => handleClick(shape)}
                                markerProps={shape => ({
                                    ...circleColorMarkerOptions(
                                        getLocationColor(shape),
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
