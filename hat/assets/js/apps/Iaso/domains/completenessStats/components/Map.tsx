import React, {
    FunctionComponent,
    useState,
    useMemo,
    useCallback,
} from 'react';
import { GeoJSON, MapContainer, Pane, ScaleControl } from 'react-leaflet';
import { Box, useTheme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { ArrowUpwardOutlined } from '@mui/icons-material';
import {
    commonStyles,
    LoadingSpinner,
    IconButton,
} from 'bluesquare-components';
import { useLocation } from 'react-router-dom';
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
    getEffectiveThreshold,
    getOrgUnitsBounds,
} from '../../../utils/map/mapUtils';

import { CustomTileLayer } from '../../../components/maps/tools/CustomTileLayer';
import { CustomZoomControl } from '../../../components/maps/tools/CustomZoomControl';

import { getDirectLegend, MapLegend } from './MapLegend';
import { useGetLegend } from '../../../components/LegendBuilder/Legend';
import { CompletenessSelect } from './CompletenessSelect';

import MESSAGES from '../messages';
import { Router } from '../../../types/general';

import { usetGetParentPageUrl } from '../utils';
import {
    AssignmentsResult,
    useGetAssignments,
} from '../../assignments/hooks/requests/useGetAssignments';
import { ScaleThreshold } from '../../../components/LegendBuilder/types';

const defaultViewport = {
    center: [1, 20],
    zoom: 3.25,
};

type Props = {
    locations: CompletenessMapStats[];
    isLoading: boolean;
    params: CompletenessRouterParams;
    selectedFormId: number;
    router: Router;
    threshold?: ScaleThreshold;
};

const boundsOptions = {
    padding: [50, 50],
    maxZoom: 12,
};

const useStyles = makeStyles(theme => ({
    mapContainer: {
        ...commonStyles(theme).mapContainer,
        height: '80vh',
        marginBottom: theme.spacing(2),
        '& .tile-switch-control': {
            top: theme.spacing(13),
        },
    },
    parentIcon: {
        position: 'absolute',
        top: -theme.spacing(6),
        right: 0,
    },
}));

export const Map: FunctionComponent<Props> = ({
    locations,
    isLoading,
    params,
    selectedFormId,
    router,
    threshold,
}) => {
    const effectiveThreshold = useMemo(
        () => getEffectiveThreshold(threshold),
        [threshold],
    );
    const { planningId } = params;
    const classes: Record<string, string> = useStyles();
    const getLegend = useGetLegend(effectiveThreshold);
    const bounds: Bounds | undefined = useMemo(
        () => locations && getOrgUnitsBounds(locations),
        [locations],
    );
    const { path } = useLocation();

    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);

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

    const {
        data,
        isFetching: isLoadingAssignments,
    }: {
        data?: AssignmentsResult;
        isFetching: boolean;
    } = useGetAssignments({ planning: planningId });
    const assignments = useMemo(
        () =>
            data?.allAssignments.filter(
                assignment =>
                    Boolean(assignment.user) || Boolean(assignment.team),
            ) || [],
        [data?.allAssignments],
    );
    const getLegendColor = useCallback(
        (value, locationId) => {
            if (planningId) {
                if (
                    !isLoadingAssignments &&
                    assignments.find(
                        assignment => assignment.org_unit === locationId,
                    )
                ) {
                    return showDirectCompleteness
                        ? getDirectLegend(value)
                        : getLegend(value);
                }

                return 'grey';
            }
            return showDirectCompleteness
                ? getDirectLegend(value)
                : getLegend(value);
        },
        [
            planningId,
            showDirectCompleteness,
            getLegend,
            isLoadingAssignments,
            assignments,
        ],
    );

    const getParentPageUrl = usetGetParentPageUrl(router);
    return (
        <section className={classes.mapContainer}>
            <Box position="relative">
                {(isLoading || isLoadingAssignments) && (
                    <LoadingSpinner absolute />
                )}
                <CompletenessSelect params={params} />
                <MapLegend
                    showDirectCompleteness={showDirectCompleteness}
                    threshold={effectiveThreshold}
                />
                {parentLocation?.parent_org_unit?.id && (
                    <Box className={classes.parentIcon}>
                        <IconButton
                            url={getParentPageUrl(
                                parentLocation?.parent_org_unit?.id,
                            )}
                            tooltipMessage={MESSAGES.seeParent}
                            overrideIcon={ArrowUpwardOutlined}
                            color="primary"
                            location={{ location: path }}
                        />
                    </Box>
                )}

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
                                getLegendColor(getPercent(stats), shape.id) ||
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
                                getLegendColor(getPercent(stats), marker.id) ||
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
