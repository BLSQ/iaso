import React, {
    FunctionComponent,
    useRef,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react';
import { useSelector } from 'react-redux';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import {
    Map,
    TileLayer,
    GeoJSON,
    Pane,
    Tooltip,
    ScaleControl,
} from 'react-leaflet';
import { Grid, Divider, makeStyles } from '@material-ui/core';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    commonStyles,
} from 'bluesquare-components';

// COMPONENTS
import ClusterSwitch from '../../../components/maps/tools/ClusterSwitchComponent';
import InnerDrawer from '../../../components/nav/InnerDrawer';
import OrgUnitPopupComponent from './OrgUnitPopupComponent';
import TileSwitch from '../../../components/maps/tools/TileSwitchComponent';
import ErrorPaperComponent from '../../../components/papers/ErrorPaperComponent';
import { Tile } from '../../../components/maps/tools/TileSwitch';
import MarkersListComponent from '../../../components/maps/markers/MarkersListComponent';
import { OrgUnitsMapComments } from './orgUnitMap/OrgUnitsMapComments';
import { innerDrawerStyles } from '../../../components/nav/InnerDrawer/styles';
// COMPONENTS

// UTILS
import {
    // ZoomControl,
    getLatLngBounds,
    getShapesBounds,
    colorClusterCustomMarker,
    circleColorMarkerOptions,
} from '../../../utils/mapUtils';
// UTILS

// TYPES
import { IntlFormatMessage } from '../../../types/intl';
import { OrgUnit } from '../types/orgUnit';
import { DropdownOptions } from '../../../types/utils';
// TYPES

// HOOKS
import { useGetOrgUnitDetail } from '../hooks/requests/useGetOrgUnitDetail';
// HOOKS
import MESSAGES from '../messages';

export type Locations = {
    locations: Array<OrgUnit[]>;
    shapes: OrgUnit[];
};
type Props = {
    // eslint-disable-next-line no-unused-vars
    getSearchColor: (index: number) => string;
    orgUnitTypes: DropdownOptions<string>[];
    orgUnits: Locations;
};

type MapState = {
    currentTile: Tile;
    isClusterActive: boolean;
};

type State = {
    map: MapState;
};

const boundsOptions = {
    padding: [50, 50],
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

const getOrgUnitsBounds = orgUnits => {
    const orgUnitsLocations = getFullOrgUnits(orgUnits.locations);
    const locationsBounds =
        orgUnitsLocations.length > 0
            ? getLatLngBounds(orgUnitsLocations)
            : null;
    const shapeBounds =
        orgUnits.shapes.length > 0 ? getShapesBounds(orgUnits.shapes) : null;
    let bounds = null;
    if (locationsBounds && shapeBounds) {
        bounds = locationsBounds.extend(shapeBounds);
    } else if (locationsBounds) {
        bounds = locationsBounds;
    } else if (shapeBounds) {
        bounds = shapeBounds;
    }
    return bounds;
};
export const OrgUnitsMap: FunctionComponent<Props> = ({
    getSearchColor,
    orgUnits,
    orgUnitTypes,
}) => {
    const map: any = useRef();
    const classes: Record<string, string> = useStyles();

    const currentTile = useSelector((state: State) => state.map.currentTile);
    const isClusterActive = useSelector(
        (state: State) => state.map.isClusterActive,
    );
    const [currentOrgUnitId, setCurrentOrgUnitId] = useState<
        number | undefined
    >();
    const { data: currentOrgUnit } = useGetOrgUnitDetail(currentOrgUnitId);

    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();

    const bounds = getOrgUnitsBounds(orgUnits);
    const orgUnitsTotal = getFullOrgUnits(orgUnits.locations);

    const fitToBounds = useCallback(() => {
        const newBounds = getOrgUnitsBounds(orgUnits);
        if (newBounds) {
            try {
                map.current?.leafletElement.fitBounds(newBounds, boundsOptions);
            } catch (e) {
                console.warn(e);
            }
        }
    }, [orgUnits]);

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

    useEffect(() => {
        fitToBounds();
    }, [fitToBounds]);
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

    return null;
    return (
        <Grid container spacing={0}>
            <InnerDrawer
                defaultActiveOption="settings"
                withTopBorder
                settingsOptionComponent={
                    <>
                        <TileSwitch />
                        <Divider />
                        <ClusterSwitch />
                        <Divider />
                    </>
                }
                commentsOptionComponent={
                    <OrgUnitsMapComments
                        className={classes.commentContainer}
                        maxPages={4}
                        orgUnit={currentOrgUnit}
                    />
                }
            >
                <Map
                    ref={map}
                    scrollWheelZoom={false}
                    maxZoom={currentTile.maxZoom}
                    style={{ height: '100%' }}
                    zoom={13}
                    zoomControl={false}
                    zoomSnap={0.1}
                    keyboard={false}
                >
                    <ScaleControl imperial={false} />
                    {/* <ZoomControl fitToBounds={() => fitToBounds()} /> */}
                    <TileLayer
                        attribution={
                            currentTile.attribution
                                ? currentTile.attribution
                                : ''
                        }
                        url={currentTile.url}
                    />
                    {orgUnits.shapes
                        .filter(o => !o.org_unit_type_id)
                        .map(o => (
                            <Pane name="no-org-unit-type" key={o.id}>
                                <GeoJSON
                                    key={`${o.id}-${o.search_index}`}
                                    style={() => ({
                                        color: getSearchColor(o.search_index),
                                    })}
                                    data={o.geo_json}
                                    onClick={() => setCurrentOrgUnitId(o.id)}
                                >
                                    <OrgUnitPopupComponent
                                        currentOrgUnit={currentOrgUnit}
                                    />
                                    <Tooltip>{o.name}</Tooltip>
                                </GeoJSON>
                            </Pane>
                        ))}
                    {orgUnitTypes.map(ot => (
                        <Pane
                            style={{
                                zIndex: 400 + (ot.original?.depth || 1),
                            }}
                            name={`org-type-${ot.original?.id}`}
                            key={ot.original?.id}
                        >
                            {orgUnits.shapes
                                .filter(
                                    o => o.org_unit_type_id === ot.original?.id,
                                )
                                .map(o => (
                                    <GeoJSON
                                        key={`${o.id}-${o.search_index}`}
                                        style={() => ({
                                            color: getSearchColor(
                                                o.search_index,
                                            ),
                                        })}
                                        data={o.geo_json}
                                        onClick={() =>
                                            setCurrentOrgUnitId(o.id)
                                        }
                                    >
                                        <OrgUnitPopupComponent
                                            currentOrgUnit={currentOrgUnit}
                                        />
                                        <Tooltip>{o.name}</Tooltip>
                                    </GeoJSON>
                                ))}
                        </Pane>
                    ))}
                    {locations}
                </Map>
            </InnerDrawer>
        </Grid>
    );
};
