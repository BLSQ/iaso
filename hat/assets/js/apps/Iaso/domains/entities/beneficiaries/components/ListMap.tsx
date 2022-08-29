import React, { FunctionComponent, useRef, useState, useEffect } from 'react';
import { Map, TileLayer, Pane, ScaleControl } from 'react-leaflet';
import { Box, useTheme } from '@material-ui/core';
import {
    // @ts-ignore
    LoadingSpinner,
} from 'bluesquare-components';

import {
    TilesSwitch,
    Tile,
} from '../../../../components/maps/tools/TileSwitch';
import MarkersListComponent from '../../../../components/maps/markers/MarkersListComponent';

import tiles from '../../../../constants/mapTiles';

import {
    ZoomControl,
    circleColorMarkerOptions,
    getLatLngBounds,
} from '../../../../utils/mapUtils';
import { OrgUnit } from '../../../orgUnits/types/orgUnit';

const defaultViewport = {
    center: [1, 20],
    zoom: 3.25,
};

type Location = {
    latitude: number;
    longitude: number;
    orgUnit: OrgUnit;
    id: number;
};

type Props = {
    // eslint-disable-next-line no-unused-vars
    handleClick: (location: Location) => void;
    locations: Location[] | undefined;
    isFetchingLocations: boolean;
};

const boundsOptions = {
    padding: [50, 50],
};

const getLocationsBounds = (locations: Location[]) =>
    locations ? getLatLngBounds(locations) : null;

export const ListMap: FunctionComponent<Props> = ({
    handleClick,
    locations,
    isFetchingLocations,
}) => {
    const mapContainer: any = useRef();
    const map: any = useRef();
    const theme = useTheme();
    const [selectedLocation, setSelectedLocation] = useState<
        Location | undefined
    >(undefined);

    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    const fitToBounds = (newLocations: Location[]) => {
        const bounds = getLocationsBounds(newLocations);
        if (newLocations.length > 0) {
            if (bounds && map?.current) {
                try {
                    map.current.leafletElement.fitBounds(bounds, boundsOptions);
                } catch (e) {
                    console.warn(e);
                }
            }
        }
    };
    const onClick = (selecteOrgunit: Location) => {
        if (!selectedLocation) {
            handleClick(selecteOrgunit);
        }
    };

    useEffect(() => {
        if (!isFetchingLocations && locations) {
            fitToBounds(locations);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFetchingLocations, locations]);
    const isLoading = isFetchingLocations;
    return (
        <section ref={mapContainer}>
            <Box position="relative">
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
                    contextmenu
                    onMovestart={() => setSelectedLocation(undefined)}
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
                            <Pane name="markers">
                                <MarkersListComponent
                                    items={locations || []}
                                    onMarkerClick={shape => onClick(shape)}
                                    markerProps={() => ({
                                        ...circleColorMarkerOptions(
                                            theme.palette.primary.main,
                                        ),
                                    })}
                                    isCircle
                                />
                            </Pane>
                        </>
                    )}
                </Map>
            </Box>
        </section>
    );
};
