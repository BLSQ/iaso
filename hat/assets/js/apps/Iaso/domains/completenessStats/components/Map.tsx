import React, { FunctionComponent, useState, useMemo } from 'react';
import { GeoJSON, MapContainer, Pane, ScaleControl } from 'react-leaflet';
import { Box, makeStyles } from '@material-ui/core';
import { commonStyles, LoadingSpinner } from 'bluesquare-components';
import { Tile } from '../../../components/maps/tools/TilesSwitchControl';
import { PopupComponent as Popup } from './Popup';

import CircleMarkerComponent from '../../../components/maps/markers/CircleMarkerComponent';

import tiles from '../../../constants/mapTiles';

import { CompletenessMapStats, CompletenessRouterParams } from '../types';
import {
    circleColorMarkerOptions,
    Bounds,
    getOrgUnitsBounds,
} from '../../../utils/map/mapUtils';

import { CustomTileLayer } from '../../../components/maps/tools/CustomTileLayer';
import { CustomZoomControl } from '../../../components/maps/tools/CustomZoomControl';

import { getLegend, MapLegend } from './MapLegend';

const defaultViewport = {
    center: [1, 20],
    zoom: 3.25,
};

type Props = {
    locations: CompletenessMapStats[];
    isFetchingLocations: boolean;
    params: CompletenessRouterParams;
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

export const Map: FunctionComponent<Props> = ({
    locations,
    isFetchingLocations,
    params,
}) => {
    const classes: Record<string, string> = useStyles();

    const bounds: Bounds | undefined = useMemo(
        () => locations && getOrgUnitsBounds(locations),
        [locations],
    );

    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);

    const isLoading = isFetchingLocations;
    const parentLocation = useMemo(() => {
        const rootArray = locations?.filter(location => location.is_root);
        return rootArray && rootArray[0];
    }, [locations]);
    const markers = useMemo(
        () =>
            locations?.filter(
                location =>
                    location.latitude &&
                    location.longitude &&
                    !location.is_root,
            ),
        [locations],
    );
    const shapes = useMemo(
        () =>
            locations?.filter(
                location => location.has_geo_json && !location.is_root,
            ),
        [locations],
    );

    return (
        <section className={classes.mapContainer}>
            <Box position="relative" mt={2}>
                {isLoading && <LoadingSpinner absolute />}
                <MapContainer
                    key={parentLocation?.id}
                    isLoading={isLoading}
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
                    <MapLegend />
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
                    <Pane name="parent">
                        {parentLocation?.has_geo_json && (
                            <GeoJSON
                                data={parentLocation.geo_json}
                                // @ts-ignore
                                style={() => ({
                                    color: 'grey',
                                    fillOpacity: 0,
                                })}
                            />
                        )}
                    </Pane>
                    <Pane name="shapes">
                        {shapes.map(shape =>
                            Object.entries(shape.form_stats).map(
                                ([key, value]) => (
                                    <GeoJSON
                                        key={`${shape.id}-${key}`}
                                        data={shape.geo_json}
                                        // @ts-ignore
                                        style={() => ({
                                            color:
                                                getLegend(value.percent)
                                                    ?.color || 'grey',
                                            fillOpacity: 0.3,
                                        })}
                                    >
                                        <Popup
                                            location={shape}
                                            params={params}
                                        />
                                    </GeoJSON>
                                ),
                            ),
                        )}
                    </Pane>

                    <Pane name="markers">
                        {markers.map(marker =>
                            Object.entries(marker.form_stats).map(
                                ([key, value]) => (
                                    <CircleMarkerComponent
                                        key={`${marker.id}-${key}`}
                                        item={marker}
                                        PopupComponent={Popup}
                                        popupProps={location => ({
                                            location,
                                            params,
                                        })}
                                        markerProps={() => ({
                                            ...circleColorMarkerOptions(
                                                value.itself_has_instances
                                                    ? 'green'
                                                    : getLegend(value.percent)
                                                          ?.color || 'grey',
                                            ),
                                            radius: 12,
                                        })}
                                    />
                                ),
                            ),
                        )}
                    </Pane>
                </MapContainer>
            </Box>
        </section>
    );
};
