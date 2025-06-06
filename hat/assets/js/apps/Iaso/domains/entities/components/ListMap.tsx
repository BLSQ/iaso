import React, {
    FunctionComponent,
    useState,
    useMemo,
    Dispatch,
    SetStateAction,
} from 'react';
import { Box, useTheme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { LoadingSpinner, commonStyles } from 'bluesquare-components';
import { MapContainer, Pane, ScaleControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';

import MarkersListComponent from '../../../components/maps/markers/MarkersListComponent';

import { CustomTileLayer } from '../../../components/maps/tools/CustomTileLayer';
import { CustomZoomControl } from '../../../components/maps/tools/CustomZoomControl';
import { Tile } from '../../../components/maps/tools/TilesSwitchControl';
import tiles from '../../../constants/mapTiles';
import {
    circleColorMarkerOptions,
    getLatLngBounds,
    clusterCustomMarker,
    Bounds,
} from '../../../utils/map/mapUtils';
import { OrgUnit } from '../../orgUnits/types/orgUnit';
import MESSAGES from '../messages';
import { Entity } from '../types/entity';
import { ExtraColumn } from '../types/fields';
import { DisplayedLocation } from '../types/locations';
import { LocationOption, LocationSwitch } from './LocationSwitch';
import { PopupComponent as Popup } from './Popup';

const defaultViewport = {
    center: [1, 20],
    zoom: 3.25,
};

export type Location = {
    latitude?: number;
    longitude?: number;
    orgUnit: OrgUnit;
    id: number;
    original: Entity;
};

type Props = {
    locations: Location[] | undefined;
    isFetchingLocations: boolean;
    extraColumns: Array<ExtraColumn>;
    displayedLocation: DisplayedLocation;
    setDisplayedLocation: Dispatch<SetStateAction<DisplayedLocation>>;
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
    displayedLocation,
    setDisplayedLocation,
}) => {
    const classes: Record<string, string> = useStyles();
    const theme = useTheme();

    const bounds: Bounds | undefined = useMemo(
        () => locations && getLocationsBounds(locations),
        [locations],
    );

    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    const locationOptions: LocationOption[] = useMemo(
        () => [
            { value: 'orgUnits', label: MESSAGES.orgUnitsLocations },
            { value: 'submissions', label: MESSAGES.submissionsLocations },
        ],
        [],
    );

    return (
        <section className={classes.mapContainer}>
            <Box position="relative">
                {isFetchingLocations && <LoadingSpinner absolute />}
                <LocationSwitch
                    displayedLocation={displayedLocation}
                    setDisplayedLocation={setDisplayedLocation}
                    locationOptions={locationOptions}
                />
                <MapContainer
                    isLoading={isFetchingLocations}
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
                    <CustomTileLayer
                        currentTile={currentTile}
                        setCurrentTile={setCurrentTile}
                    />
                    <CustomZoomControl
                        bounds={bounds}
                        boundsOptions={boundsOptions}
                        fitOnLoad
                    />
                    {locations && (
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
                    )}
                </MapContainer>
            </Box>
        </section>
    );
};
