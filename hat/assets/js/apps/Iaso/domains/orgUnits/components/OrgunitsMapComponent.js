import React, { Component } from 'react';
import {
    Map,
    TileLayer,
    GeoJSON,
    ScaleControl,
    Tooltip,
    Pane,
} from 'react-leaflet';
import { connect } from 'react-redux';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import isEqual from 'lodash/isEqual';

import { Grid, Divider, withStyles } from '@material-ui/core';

import PropTypes from 'prop-types';
import { injectIntl, commonStyles } from 'bluesquare-components';

import {
    ZoomControl,
    getLatLngBounds,
    getShapesBounds,
    colorClusterCustomMarker,
    circleColorMarkerOptions,
} from '../../../utils/mapUtils';

import { resetMapReducer } from '../../../redux/mapReducer';
import { setCurrentSubOrgUnit } from '../actions';

import TileSwitch from '../../../components/maps/tools/TileSwitchComponent';
import ClusterSwitch from '../../../components/maps/tools/ClusterSwitchComponent';
import MarkersListComponent from '../../../components/maps/markers/MarkersListComponent';
import ErrorPaperComponent from '../../../components/papers/ErrorPaperComponent';
import InnerDrawer from '../../../components/nav/InnerDrawer';
import OrgUnitPopupComponent from './OrgUnitPopupComponent';

import { fetchOrgUnitDetail } from '../../../utils/requests';
import { getChipColors } from '../../../constants/chipColors';
import { getColorsFromParams, decodeSearch } from '../utils';
import { waitFor } from '../../../utils';
import MESSAGES from '../messages';
import { OrgUnitsMapComments } from './orgUnitMap/OrgUnitsMapComments';
import { innerDrawerStyles } from '../../../components/nav/InnerDrawer/styles';

const boundsOptions = {
    padding: [50, 50],
};
const styles = theme => ({
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
});

const getFullOrgUnits = orgUnits => {
    let fullOrUnits = [];
    Object.values(orgUnits).forEach(searchOrgUnits => {
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
class OrgunitsMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
            fittedToBounds: false,
        };
    }

    componentDidMount() {
        const { orgUnits } = this.props;
        this.checkFitToBounds(orgUnits);
        this.props.setCurrentSubOrgUnit(null);
    }

    shouldComponentUpdate(nextProps) {
        return (
            !isEqual(nextProps.orgUnits, this.props.orgUnits) ||
            !isEqual(nextProps.currentTile, this.props.currentTile) ||
            !isEqual(nextProps.isClusterActive, this.props.isClusterActive) ||
            !isEqual(
                getColorsFromParams(nextProps.params),
                getColorsFromParams(this.props.params),
            ) ||
            !isEqual(nextProps.orgUnitTypes, this.props.orgUnitTypes)
        );
    }

    async componentDidUpdate() {
        await waitFor(500);
        const { orgUnits } = this.props;
        this.checkFitToBounds(orgUnits);
    }

    componentWillUnmount() {
        this.props.resetMapReducer();
    }

    setFittedToBound() {
        this.setState({
            fittedToBounds: true,
        });
    }

    getSearchColor(currentSearchIndex) {
        const { params } = this.props;
        const searches = decodeSearch(params.searches);
        const currentSearch = searches[currentSearchIndex];
        let currentColor;
        if (currentSearch) {
            currentColor = currentSearch.color;
        }
        if (!currentColor) {
            currentColor = getChipColors(0);
        } else {
            currentColor = `#${currentColor}`;
        }
        return currentColor;
    }

    checkFitToBounds(orgUnits) {
        const { fittedToBounds } = this.state;
        if (
            !fittedToBounds &&
            (orgUnits.locations.length > 0 || orgUnits.shapes.length > 0)
        ) {
            this.setFittedToBound();
            this.fitToBounds();
        }
    }

    fetchDetail(orgUnit) {
        const { dispatch } = this.props;
        // Removed this as it seems useless and create UI bugs
        // this.props.setCurrentSubOrgUnit(null);
        fetchOrgUnitDetail(dispatch, orgUnit.id)
            .then(i => this.props.setCurrentSubOrgUnit(i))
            .catch(e => {
                console.warn('error fetching Org Unit Detail', e);
                this.props.setCurrentSubOrgUnit(null);
            });
    }

    fitToBounds() {
        const { orgUnits } = this.props;
        const bounds = getOrgUnitsBounds(orgUnits);
        if (bounds) {
            try {
                this.map.leafletElement.fitBounds(bounds, boundsOptions);
            } catch (e) {
                console.warn(e);
            }
        }
    }

    render() {
        const {
            orgUnits,
            currentTile,
            isClusterActive,
            intl: { formatMessage },
            classes,
            orgUnitTypes,
        } = this.props;
        const bounds = getOrgUnitsBounds(orgUnits);
        const orgUnitsTotal = getFullOrgUnits(orgUnits.locations);
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
        if (this.map) {
            this.map.leafletElement.options.maxZoom = currentTile.maxZoom;
        }
        const getShape = ou => (
            <GeoJSON
                key={ou.id}
                style={() => ({
                    color: this.getSearchColor(ou.search_index),
                })}
                data={ou.geo_json}
                onClick={() => this.fetchDetail(ou)}
            >
                <OrgUnitPopupComponent />
                <Tooltip>{ou.name}</Tooltip>
            </GeoJSON>
        );
        return (
            <Grid container spacing={0}>
                <InnerDrawer
                    defaultActiveOption="comments"
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
                            getOrgUnitFromStore
                        />
                    }
                >
                    <Map
                        ref={ref => {
                            this.map = ref;
                        }}
                        scrollWheelZoom={false}
                        maxZoom={currentTile.maxZoom}
                        style={{ height: '100%' }}
                        zoom={13}
                        zoomControl={false}
                        zoomSnap={0.1}
                        keyboard={false}
                    >
                        <ScaleControl imperial={false} />
                        <ZoomControl
                            fitToBounds={() => {
                                return this.fitToBounds();
                            }}
                        />
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
                                    {getShape(o)}
                                </Pane>
                            ))}
                        {orgUnitTypes.map(ot => (
                            <Pane
                                style={{
                                    zIndex: 400 + (ot.original.depth || 1),
                                }}
                                name={`org-type-${ot.original.id}`}
                                key={ot.original.id}
                            >
                                {orgUnits.shapes
                                    .filter(
                                        o =>
                                            o.org_unit_type_id ===
                                            ot.original.id,
                                    )
                                    .map(o => getShape(o))}
                            </Pane>
                        ))}
                        {isClusterActive &&
                            orgUnits.locations.map(
                                (orgUnitsBySearch, searchIndex) => {
                                    const color =
                                        this.getSearchColor(searchIndex);
                                    if (orgUnitsBySearch.length === 0)
                                        return null;
                                    return (
                                        <MarkerClusterGroup
                                            iconCreateFunction={cluster =>
                                                colorClusterCustomMarker(
                                                    cluster,
                                                    color,
                                                )
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
                                                        ...circleColorMarkerOptions(
                                                            color,
                                                        ),
                                                    })}
                                                    items={orgUnitsBySearch}
                                                    onMarkerClick={o =>
                                                        this.fetchDetail(o)
                                                    }
                                                    PopupComponent={
                                                        OrgUnitPopupComponent
                                                    }
                                                    tooltipProps={e => ({
                                                        children: [e.name],
                                                    })}
                                                    TooltipComponent={Tooltip}
                                                    isCircle
                                                />
                                            </Pane>
                                        </MarkerClusterGroup>
                                    );
                                },
                            )}
                        {!isClusterActive &&
                            orgUnits.locations.map(
                                (orgUnitsBySearch, searchIndex) => (
                                    <Pane
                                        key={searchIndex}
                                        name={`markers-${searchIndex}`}
                                        style={{ zIndex: 500 }}
                                    >
                                        <MarkersListComponent
                                            key={searchIndex}
                                            markerProps={() => ({
                                                ...circleColorMarkerOptions(
                                                    this.getSearchColor(
                                                        searchIndex,
                                                    ),
                                                ),
                                            })}
                                            items={orgUnitsBySearch}
                                            onMarkerClick={o =>
                                                this.fetchDetail(o)
                                            }
                                            PopupComponent={
                                                OrgUnitPopupComponent
                                            }
                                            tooltipProps={e => ({
                                                children: [e.name],
                                            })}
                                            TooltipComponent={Tooltip}
                                            isCircle
                                        />
                                    </Pane>
                                ),
                            )}
                    </Map>
                </InnerDrawer>
            </Grid>
        );
    }
}

OrgunitsMap.propTypes = {
    orgUnits: PropTypes.object.isRequired,
    currentTile: PropTypes.object.isRequired,
    resetMapReducer: PropTypes.func.isRequired,
    isClusterActive: PropTypes.bool.isRequired,
    intl: PropTypes.object.isRequired,
    setCurrentSubOrgUnit: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    params: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    currentTile: state.map.currentTile,
    isClusterActive: state.map.isClusterActive,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    resetMapReducer: currentTile => dispatch(resetMapReducer(currentTile)),
    setCurrentSubOrgUnit: i => dispatch(setCurrentSubOrgUnit(i)),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgunitsMap)),
);
