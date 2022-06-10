import React, { FunctionComponent, useRef, useState } from 'react';
import { Map, TileLayer, GeoJSON, Pane, Tooltip } from 'react-leaflet';
import { Box } from '@material-ui/core';
import {
    // @ts-ignore
    useSkipEffectOnMount,
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
export const AssignmentsMap: FunctionComponent<Props> = ({
    assignments,
    planning,
}) => {
    const map: any = useRef();
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    const { data: locations, isFetching: isFetchingLocations } =
        useGetOrgUnitLocations(planning?.org_unit);

    const fitToBounds = () => {
        const shapeBounds = locations
            ? getShapesBounds(locations.shapes)
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
        if (bounds && map?.current) {
            try {
                map.current.leafletElement.fitBounds(bounds, boundsOptions);
            } catch (e) {
                console.warn(e);
            }
        }
    };

    useSkipEffectOnMount(() => {
        if (!isFetchingLocations) {
            fitToBounds();
        }
    }, [isFetchingLocations]);
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
                    attribution={
                        currentTile.attribution ? currentTile.attribution : ''
                    }
                    url={currentTile.url}
                />
                <ZoomControl fitToBounds={fitToBounds} />
                <Pane name="shapes">
                    {locations?.shapes.map(shape => (
                        <GeoJSON key={shape.id} data={shape.geoJson} />
                    ))}
                </Pane>
                <Pane name="markers">
                    <MarkersListComponent
                        items={locations?.markers || []}
                        onMarkerClick={() => console.log('click')}
                        markerProps={() => ({
                            ...circleColorMarkerOptions('#006699'),
                        })}
                        tooltipProps={orgUnit => ({
                            children: [orgUnit.name],
                        })}
                        TooltipComponent={Tooltip}
                        isCircle
                        // PopupComponent={
                        //     OrgUnitPopupComponent
                        // }
                    />
                </Pane>
            </Map>
        </Box>
    );
};
