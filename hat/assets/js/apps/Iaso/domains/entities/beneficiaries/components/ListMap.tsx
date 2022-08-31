import React, { FunctionComponent, useRef, useState, useEffect } from 'react';
import { Map, TileLayer, Pane, ScaleControl } from 'react-leaflet';
import { Box, useTheme, makeStyles } from '@material-ui/core';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import {
    // @ts-ignore
    LoadingSpinner,
    // @ts-ignore
    commonStyles,
} from 'bluesquare-components';

import {
    TilesSwitch,
    Tile,
} from '../../../../components/maps/tools/TileSwitch';
import { PopupComponent as Popup } from './Popup';

import MarkersListComponent from '../../../../components/maps/markers/MarkersListComponent';

import tiles from '../../../../constants/mapTiles';

import { Beneficiary } from '../types/beneficiary';

import {
    ZoomControl,
    circleColorMarkerOptions,
    getLatLngBounds,
    clusterCustomMarker,
} from '../../../../utils/mapUtils';
import { OrgUnit } from '../../../orgUnits/types/orgUnit';

const defaultViewport = {
    center: [1, 20],
    zoom: 3.25,
};

export type Location = {
    latitude?: number;
    longitude?: number;
    orgUnit: OrgUnit;
    id: number;
    original: Beneficiary;
};

type Props = {
    locations: Location[] | undefined;
    isFetchingLocations: boolean;
};

const boundsOptions = {
    padding: [50, 50],
    maxZoom: 12,
};

const useStyles = makeStyles(theme => ({
    mapContainer: {
        ...commonStyles(theme).mapContainer,
    },
}));

const getLocationsBounds = (locations: Location[]) =>
    locations ? getLatLngBounds(locations) : null;

export const ListMap: FunctionComponent<Props> = ({
    locations,
    isFetchingLocations,
}) => {
    const mapContainer: any = useRef();
    const map: any = useRef();
    const classes: Record<string, string> = useStyles();
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
        setSelectedLocation(selecteOrgunit);
    };

    useEffect(() => {
        if (!isFetchingLocations && locations) {
            fitToBounds(locations);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFetchingLocations, locations]);
    const isLoading = isFetchingLocations;
    return (
        <section ref={mapContainer} className={classes.mapContainer}>
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
                    style={{ height: '60vh' }}
                    center={defaultViewport.center}
                    zoom={defaultViewport.zoom}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    contextmenu
                    onMovestart={() => setSelectedLocation(undefined)}
                    refocusOnMap={false}
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
                                <MarkerClusterGroup
                                    iconCreateFunction={clusterCustomMarker}
                                >
                                    <MarkersListComponent
                                        items={locations || []}
                                        onMarkerClick={shape => onClick(shape)}
                                        markerProps={() => ({
                                            ...circleColorMarkerOptions(
                                                theme.palette.primary.main,
                                            ),
                                        })}
                                        popupProps={{ selectedLocation }}
                                        PopupComponent={Popup}
                                        isCircle
                                    />
                                </MarkerClusterGroup>
                            </Pane>
                        </>
                    )}
                </Map>
            </Box>
        </section>
    );
};
