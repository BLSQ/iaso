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

import MarkersListComponent from '../../../components/maps/markers/MarkersListComponent';
import { Tile } from '../../../components/maps/tools/TilesSwitchControl';
import ErrorPaperComponent from '../../../components/papers/ErrorPaperComponent';
import OrgUnitPopupComponent from './OrgUnitPopupComponent';

import {
    Bounds,
    circleColorMarkerOptions,
    colorClusterCustomMarker,
    getLatLngBounds,
    getShapesBounds,
} from '../../../utils/map/mapUtils';

import { DropdownOptions } from '../../../types/utils';
import { OrgUnit } from '../types/orgUnit';

import { CustomTileLayer } from '../../../components/maps/tools/CustomTileLayer';
import { CustomZoomControl } from '../../../components/maps/tools/CustomZoomControl';
import { MapToggleCluster } from '../../../components/maps/tools/MapToggleCluster';
import { InnerDrawer } from '../../../components/nav/InnerDrawer/Index';
import tiles from '../../../constants/mapTiles';
import MESSAGES from '../messages';
import { useGetOrgUnitTypesDropdownOptions } from '../orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { OrgUnitsMapComments } from './orgUnitMap/OrgUnitComments/OrgUnitsMapComments';

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

const getFullOrgUnits = orgUnits => {
    let fullOrUnits = [];
    Object.values(orgUnits).forEach(searchOrgUnits => {
        // @ts-ignore
        fullOrUnits = fullOrUnits.concat(searchOrgUnits);
    });
    return fullOrUnits;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    commentContainer: {
        height: '60vh',
        overflowY: 'auto',
    },
}));

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

const computeTriggerFitToBoundsId = (bounds: Bounds | undefined): string => {
    return bounds
        ? `${bounds._northEast.lat},${bounds._northEast.lng},${bounds._southWest.lat},${bounds._southWest.lng}`
        : '';
};

export const OrgUnitsMap: FunctionComponent<Props> = ({
    getSearchColor,
    orgUnits,
}) => {
    const classes = useStyles();
    const { data: orgUnitTypes } = useGetOrgUnitTypesDropdownOptions();
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    const [isClusterActive, setIsClusterActive] = useState<boolean>(true);

    const [selectedOrgUnit, setSelectedOrgUnit] = useState<
        OrgUnit | undefined
    >();
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const bounds: Bounds | undefined = getOrgUnitsBounds(orgUnits);
    const triggerFitToBoundsId: string = computeTriggerFitToBoundsId(bounds);
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
                                popupProps={instance => ({
                                    orgUnitId: instance.id,
                                })}
                                PopupComponent={OrgUnitPopupComponent}
                                tooltipProps={e => ({
                                    children: [e.name],
                                })}
                                TooltipComponent={Tooltip}
                                isCircle
                                onMarkerClick={o => setSelectedOrgUnit(o)}
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
                    popupProps={instance => ({
                        orgUnitId: instance.id,
                    })}
                    PopupComponent={OrgUnitPopupComponent}
                    tooltipProps={e => ({
                        children: [e.name],
                    })}
                    TooltipComponent={Tooltip}
                    isCircle
                    onMarkerClick={o => setSelectedOrgUnit(o)}
                />
            </Pane>
        ));
    }, [getSearchColor, isClusterActive, orgUnits.locations]);

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
                        orgUnit={selectedOrgUnit}
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
                            triggerFitToBoundsId={triggerFitToBoundsId}
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
                                        onClick={() => setSelectedOrgUnit(o)}
                                    >
                                        <OrgUnitPopupComponent
                                            orgUnitId={o.id}
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
                                            onClick={() =>
                                                setSelectedOrgUnit(o)
                                            }
                                        >
                                            <OrgUnitPopupComponent
                                                orgUnitId={o.id}
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
