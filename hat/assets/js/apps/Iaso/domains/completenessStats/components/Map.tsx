import React, {
    FunctionComponent,
    useState,
    useMemo,
    useCallback,
} from 'react';
import { GeoJSON, MapContainer, Pane, ScaleControl } from 'react-leaflet';
import { Box, makeStyles, useTheme } from '@material-ui/core';
import { commonStyles, LoadingSpinner } from 'bluesquare-components';
import { Tile } from '../../../components/maps/tools/TilesSwitchControl';
import { PopupComponent as Popup } from './Popup';

import CircleMarkerComponent from '../../../components/maps/markers/CircleMarkerComponent';

import tiles from '../../../constants/mapTiles';

import {
    CompletenessMapStats,
    CompletenessRouterParams,
    FormStat,
} from '../types';
import {
    circleColorMarkerOptions,
    Bounds,
    getOrgUnitsBounds,
} from '../../../utils/map/mapUtils';

import { CustomTileLayer } from '../../../components/maps/tools/CustomTileLayer';
import { CustomZoomControl } from '../../../components/maps/tools/CustomZoomControl';

import { getDirectLegend, getLegend, MapLegend } from './MapLegend';
import { CompletenessSelect } from './CompletenessSelect';

const defaultViewport = {
    center: [1, 20],
    zoom: 3.25,
};

type Props = {
    locations: CompletenessMapStats[];
    isFetchingLocations: boolean;
    params: CompletenessRouterParams;
    selectedFormId: number;
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
        '& .tile-switch-control': {
            top: theme.spacing(13),
        },
    },
}));

export const Map: FunctionComponent<Props> = ({
    locations,
    isFetchingLocations,
    params,
    selectedFormId,
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
                    location.form_stats[`form_${selectedFormId}`] &&
                    location.latitude &&
                    location.longitude &&
                    !location.is_root,
            ),
        [locations, selectedFormId],
    );
    const shapes = useMemo(
        () =>
            locations?.filter(location => {
                return (
                    location.form_stats[`form_${selectedFormId}`] &&
                    location.has_geo_json &&
                    !location.is_root
                );
            }),
        [locations, selectedFormId],
    );

    const theme = useTheme();
    const showDirectCompleteness = params.showDirectCompleteness === 'true';
    const getPercent = useCallback(
        (stats: FormStat): any => {
            if (showDirectCompleteness) {
                return stats.itself_has_instances ? 100 : 0;
            }
            return stats.percent;
        },
        [showDirectCompleteness],
    );
    const getLegendColor = useCallback(
        value =>
            showDirectCompleteness ? getDirectLegend(value) : getLegend(value),
        [showDirectCompleteness],
    );
    return (
        <section className={classes.mapContainer}>
            <Box position="relative">
                {isLoading && <LoadingSpinner absolute />}
                <CompletenessSelect params={params} />
                <MapLegend showDirectCompleteness={showDirectCompleteness} />
                <MapContainer
                    key={parentLocation?.id}
                    isLoading={isLoading}
                    maxZoom={currentTile.maxZoom}
                    style={{ height: '80vh' }}
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
                        {shapes.map(shape => {
                            const stats =
                                shape.form_stats[`form_${selectedFormId}`];
                            const color =
                                getLegendColor(getPercent(stats)) ||
                                theme.palette.primary.main;
                            return (
                                <GeoJSON
                                    key={`${shape.id}-${params.showDirectCompleteness}`}
                                    data={shape.geo_json}
                                    // @ts-ignore
                                    style={() => ({
                                        color,
                                        fillOpacity: 0.3,
                                    })}
                                >
                                    <Popup
                                        location={shape}
                                        params={params}
                                        stats={stats}
                                    />
                                </GeoJSON>
                            );
                        })}
                    </Pane>

                    <Pane name="markers">
                        {markers.map(marker => {
                            const stats =
                                marker.form_stats[`form_${selectedFormId}`];
                            const color =
                                getLegendColor(getPercent(stats)) ||
                                theme.palette.primary.main;
                            return (
                                <CircleMarkerComponent
                                    key={`${marker.id}-${params.showDirectCompleteness}`}
                                    item={marker}
                                    PopupComponent={Popup}
                                    popupProps={location => ({
                                        location,
                                        params,
                                        stats,
                                    })}
                                    markerProps={() => ({
                                        ...circleColorMarkerOptions(color),
                                        radius: 12,
                                    })}
                                />
                            );
                        })}
                    </Pane>
                </MapContainer>
            </Box>
        </section>
    );
};
