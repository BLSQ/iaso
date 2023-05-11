import React, { FunctionComponent, useState, useMemo } from 'react';
import { MapContainer, Pane, ScaleControl } from 'react-leaflet';
import { Box, useTheme, makeStyles } from '@material-ui/core';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { LoadingSpinner, commonStyles } from 'bluesquare-components';

import { Tile } from '../../../components/maps/tools/TileSwitch';
import { PopupComponent as Popup } from './Popup';

import MarkersListComponent from '../../../components/maps/markers/MarkersListComponent';

import tiles from '../../../constants/mapTiles';
import { ExtraColumn } from '../types/fields';

import { Beneficiary } from '../types/beneficiary';

import {
    circleColorMarkerOptions,
    getLatLngBounds,
    clusterCustomMarker,
} from '../../../utils/mapUtils';
import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { TilesSwitchDialog } from '../../../components/maps/tools/TilesSwitchDialog';
import { CustomTileLayer } from '../../../components/maps/CustomTileLayer';
import { CustomZoomControl } from '../../../components/maps/CustomZoomControl';

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
    extraColumns: Array<ExtraColumn>;
};

const boundsOptions = {
    padding: [50, 50],
    maxZoom: 12,
};

const useStyles = makeStyles(theme => ({
    mapContainer: {
        ...commonStyles(theme).mapContainer,
        height: '60vh',
        marginBottom: 0,
    },
}));

const getLocationsBounds = (locations: Location[]) =>
    locations ? getLatLngBounds(locations) : null;

export const ListMap: FunctionComponent<Props> = ({
    locations,
    isFetchingLocations,
    extraColumns,
}) => {
    const classes: Record<string, string> = useStyles();
    const theme = useTheme();

    const bounds = useMemo(
        () => locations && getLocationsBounds(locations),
        [locations],
    );

    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);

    const isLoading = isFetchingLocations;
    return (
        <section className={classes.mapContainer}>
            <Box position="relative">
                <TilesSwitchDialog
                    currentTile={currentTile}
                    setCurrentTile={setCurrentTile}
                />
                {isLoading && <LoadingSpinner absolute />}
                <MapContainer
                    isLoading={isLoading}
                    zoomSnap={0.25}
                    maxZoom={currentTile.maxZoom}
                    style={{ height: '60vh' }}
                    center={defaultViewport.center}
                    zoom={defaultViewport.zoom}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    contextmenu
                    refocusOnMap={false}
                    bounds={bounds}
                    boundsOptions={boundsOptions}
                >
                    <ScaleControl imperial={false} />
                    <CustomTileLayer currentTile={currentTile} />
                    <CustomZoomControl
                        bounds={bounds}
                        boundsOptions={boundsOptions}
                        fitOnLoad
                    />
                    {locations && (
                        <>
                            <Pane name="markers">
                                <MarkerClusterGroup
                                    iconCreateFunction={clusterCustomMarker}
                                >
                                    <MarkersListComponent
                                        items={locations || []}
                                        markerProps={() => ({
                                            ...circleColorMarkerOptions(
                                                theme.palette.primary.main,
                                            ),
                                            radius: 12,
                                        })}
                                        popupProps={location => ({
                                            location,
                                            extraColumns,
                                        })}
                                        PopupComponent={Popup}
                                        isCircle
                                    />
                                </MarkerClusterGroup>
                            </Pane>
                        </>
                    )}
                </MapContainer>
            </Box>
        </section>
    );
};
