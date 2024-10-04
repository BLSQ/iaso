import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    IntlFormatMessage,
    useSafeIntl,
} from 'bluesquare-components';
import React, { FunctionComponent, useMemo, useState } from 'react';
import {
    GeoJSON,
    MapContainer,
    Pane,
    ScaleControl,
    Tooltip,
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';

// COMPONENTS

import MarkersListComponent from '../../../components/maps/markers/MarkersListComponent';
import { Tile } from '../../../components/maps/tools/TilesSwitchControl';
import { innerDrawerStyles } from '../../../components/nav/InnerDrawer/styles';
import ErrorPaperComponent from '../../../components/papers/ErrorPaperComponent';
import { OrgUnitsMapComments } from './orgUnitMap/OrgUnitsMapComments';
import OrgUnitPopupComponent from './OrgUnitPopupComponent';
// COMPONENTS

// UTILS
import {
    Bounds,
    circleColorMarkerOptions,
    colorClusterCustomMarker,
    getLatLngBounds,
    getShapesBounds,
} from '../../../utils/map/mapUtils';
// UTILS

// TYPES
import { DropdownOptions } from '../../../types/utils';
import { OrgUnit } from '../types/orgUnit';
// TYPES

// HOOKS
import { useGetOrgUnitDetail } from '../hooks/requests/useGetOrgUnitDetail';
// HOOKS
import { CustomTileLayer } from '../../../components/maps/tools/CustomTileLayer';
import { CustomZoomControl } from '../../../components/maps/tools/CustomZoomControl';
import { MapToggleCluster } from '../../../components/maps/tools/MapToggleCluster';
import { InnerDrawer } from '../../../components/nav/InnerDrawer/Index';
import tiles from '../../../constants/mapTiles';
import { useGetOrgUnitTypes } from '../hooks/requests/useGetOrgUnitTypes';
import MESSAGES from '../messages';

type OrgUnitWithSearchIndex = Omit<OrgUnit, 'search_index'> & {
    search_index: number;
};

export type Locations = {
    locations: Array<OrgUnitWithSearchIndex[]>;
    shapes: OrgUnitWithSearchIndex[];
};
type Props = {
    getSearchColor: (index: number) => string;
    orgUnits: Locations;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    ...innerDrawerStyles(theme),
    innerDrawerToolbar: {
        ...innerDrawerStyles(theme).innerDrawerToolbar,
        '& section': {
            width: '100%',
        },
    },
    commentContainer: {
        height: '60vh',
        overflowY: 'auto',
    },
}));

const getFullOrgUnits = orgUnits => {
    let fullOrUnits = [];
    Object.values(orgUnits).forEach(searchOrgUnits => {
        // @ts-ignore
        fullOrUnits = fullOrUnits.concat(searchOrgUnits);
    });
    return fullOrUnits;
};

const getOrgUnitsBounds = (orgUnits: Locations): Bounds | undefined => {
    const orgUnitsLocations = getFullOrgUnits(orgUnits.locations);
    const locationsBounds =
        orgUnitsLocations.length > 0
            ? getLatLngBounds(orgUnitsLocations)
            : null;
    const shapeBounds =
        orgUnits.shapes.length > 0 ? getShapesBounds(orgUnits.shapes) : null;
    if (locationsBounds && shapeBounds) {
        return locationsBounds.extend(shapeBounds);
    }
    if (locationsBounds) {
        return locationsBounds;
    }
    if (shapeBounds) {
        return shapeBounds;
    }
    return undefined;
};
export const OrgUnitsMap: FunctionComponent<Props> = ({
    getSearchColor,
    orgUnits,
}) => {
    const classes: Record<string, string> = useStyles();
    const { data: orgUnitTypes } = useGetOrgUnitTypes();
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    const [isClusterActive, setIsClusterActive] = useState<boolean>(true);
    const [currentOrgUnitId, setCurrentOrgUnitId] = useState<
        number | undefined
    >();
    const { data: currentOrgUnit } = useGetOrgUnitDetail(currentOrgUnitId);

    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();

    const bounds: Bounds | undefined = getOrgUnitsBounds(orgUnits);
    const orgUnitsTotal = getFullOrgUnits(orgUnits.locations);

    const locations = useMemo(() => {
        if (isClusterActive) {
            return orgUnits.locations.map((orgUnitsBySearch, searchIndex) => {
                const color = getSearchColor(searchIndex);
                if (orgUnitsBySearch.length === 0) return null;
                return (
                    <MarkerClusterGroup
                        iconCreateFunction={cluster =>
                            colorClusterCustomMarker(cluster, color)
                        }
                        key={searchIndex}
                        polygonOptions={{
                            fillColor: color,
                            color,
                        }}
                    >
                        <Pane
                            name={`markers-${searchIndex}`}
                            style={{ zIndex: 500 }}
                        >
                            <MarkersListComponent
                                markerProps={() => ({
                                    ...circleColorMarkerOptions(color),
                                })}
                                items={orgUnitsBySearch}
                                onMarkerClick={o => setCurrentOrgUnitId(o.id)}
                                popupProps={() => ({
                                    currentOrgUnit,
                                })}
                                PopupComponent={OrgUnitPopupComponent}
                                tooltipProps={e => ({
                                    children: [e.name],
                                })}
                                TooltipComponent={Tooltip}
                                isCircle
                            />
                        </Pane>
                    </MarkerClusterGroup>
                );
            });
        }
        return orgUnits.locations.map((orgUnitsBySearch, searchIndex) => (
            <Pane
                key={searchIndex}
                name={`markers-${searchIndex}`}
                style={{ zIndex: 500 }}
            >
                <MarkersListComponent
                    key={searchIndex}
                    markerProps={() => ({
                        ...circleColorMarkerOptions(
                            getSearchColor(searchIndex),
                        ),
                    })}
                    items={orgUnitsBySearch}
                    onMarkerClick={o => setCurrentOrgUnitId(o.id)}
                    popupProps={() => ({
                        currentOrgUnit,
                    })}
                    PopupComponent={OrgUnitPopupComponent}
                    tooltipProps={e => ({
                        children: [e.name],
                    })}
                    TooltipComponent={Tooltip}
                    isCircle
                />
            </Pane>
        ));
    }, [currentOrgUnit, getSearchColor, isClusterActive, orgUnits.locations]);

    if (!bounds && orgUnitsTotal.length > 0) {
        return (
            <Grid container spacing={0}>
                <Grid item xs={3} />
                <Grid item xs={6}>
                    <ErrorPaperComponent
                        message={formatMessage(MESSAGES.missingGeolocation)}
                    />
                </Grid>
                <Grid item xs={3} />
            </Grid>
        );
    }
    const boundsOptions: Record<string, any> = {
        padding: [10, 10],
        maxZoom: currentTile.maxZoom,
    };
    return (
        <Grid container spacing={0}>
            <InnerDrawer
                defaultActiveOption="comments"
                withTopBorder
                commentsOptionComponent={
                    <OrgUnitsMapComments
                        className={classes.commentContainer}
                        maxPages={4}
                        orgUnit={currentOrgUnit}
                    />
                }
            >
                <Box position="relative">
                    <MapToggleCluster
                        isClusterActive={isClusterActive}
                        setIsClusterActive={setIsClusterActive}
                    />
                    <MapContainer
                        doubleClickZoom={false}
                        scrollWheelZoom={false}
                        maxZoom={currentTile.maxZoom}
                        style={{ height: '80vh', width: '100%' }}
                        center={[0, 0]}
                        zoomControl={false}
                        keyboard={false}
                        boxZoom
                        bounds={bounds}
                        boundsOptions={boundsOptions}
                        trackResize
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
                        {orgUnits.shapes
                            .filter(o => !o.org_unit_type_id)
                            .map(o => (
                                <Pane name="no-org-unit-type" key={o.id}>
                                    <GeoJSON
                                        key={`${o.id}-${o.search_index}`}
                                        style={{
                                            color: getSearchColor(
                                                o.search_index || 0,
                                            ),
                                        }}
                                        data={o.geo_json}
                                        eventHandlers={{
                                            click: () =>
                                                setCurrentOrgUnitId(o.id),
                                        }}
                                    >
                                        <OrgUnitPopupComponent
                                            currentOrgUnit={currentOrgUnit}
                                        />
                                        <Tooltip pane="popupPane">
                                            {o.name}
                                        </Tooltip>
                                    </GeoJSON>
                                </Pane>
                            ))}
                        {(
                            orgUnitTypes || new Array<DropdownOptions<string>>()
                        ).map(ot => (
                            <Pane
                                style={{
                                    zIndex: 400 + (ot.original?.depth || 1),
                                }}
                                name={`org-type-${ot.original?.id}`}
                                key={ot.original?.id}
                            >
                                {orgUnits.shapes
                                    .filter(
                                        o =>
                                            o.org_unit_type_id ===
                                            ot.original?.id,
                                    )
                                    .map(o => (
                                        <GeoJSON
                                            key={`${o.id}-${o.search_index}`}
                                            style={{
                                                color: getSearchColor(
                                                    o.search_index || 0,
                                                ),
                                            }}
                                            data={o.geo_json}
                                            eventHandlers={{
                                                click: () =>
                                                    setCurrentOrgUnitId(o.id),
                                            }}
                                        >
                                            <OrgUnitPopupComponent
                                                currentOrgUnit={currentOrgUnit}
                                            />
                                            <Tooltip pane="popupPane">
                                                {o.name}
                                            </Tooltip>
                                        </GeoJSON>
                                    ))}
                            </Pane>
                        ))}
                        {locations}
                    </MapContainer>
                </Box>
            </InnerDrawer>
        </Grid>
    );
};
