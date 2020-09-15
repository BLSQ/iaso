import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { Map, TileLayer, GeoJSON } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { injectIntl, intlShape } from 'react-intl';
import camelCase from 'lodash/camelCase';
import isEqual from 'lodash/isEqual';

import { Grid, Divider, Box, withStyles } from '@material-ui/core';

import PropTypes from 'prop-types';
import { locationsLimit } from '../../../constants/filters';

import {
    getLatLngBounds,
    getShapesBounds,
    colorClusterCustomMarker,
    customZoomBar,
    circleColorMarkerOptions,
} from '../../../utils/mapUtils';

import { resetMapReducer } from '../../../redux/mapReducer';
import { setCurrentSubOrgUnit } from '../actions';

import TileSwitch from '../../../components/maps/tools/TileSwitchComponent';
import ClusterSwitch from '../../../components/maps/tools/ClusterSwitchComponent';
import MarkersListComponent from '../../../components/maps/markers/MarkersListComponent';
import ErrorPaperComponent from '../../../components/papers/ErrorPaperComponent';
import OrgUnitPopupComponent from './OrgUnitPopupComponent';
import InnerDrawer from '../../../components/nav/InnerDrawerComponent';
import FiltersComponent from '../../../components/filters/FiltersComponent';

import { fetchOrgUnitDetail } from '../../../utils/requests';
import { getChipColors } from '../../../constants/chipColors';
import commonStyles from '../../../styles/common';
import { getColorsFromParams, decodeSearch } from '../utils';
import MESSAGES from '../messages';

const boundsOptions = {
    padding: [50, 50],
};
const styles = theme => ({
    ...commonStyles(theme),
    innerDrawerToolbar: {
        ...commonStyles(theme).innerDrawerToolbar,
        '& section': {
            width: '100%',
        },
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
        const {
            orgUnitTypes,
            intl: { formatMessage },
        } = this.props;
        const zoomBar = customZoomBar(formatMessage, () => this.fitToBounds());
        zoomBar.addTo(this.map.leafletElement);
        if (orgUnitTypes.length === 0) {
            this.map.leafletElement.createPane('custom-shape-pane');
        } else {
            orgUnitTypes.forEach(ot => {
                const otName = camelCase(ot.name);
                this.map.leafletElement.createPane(
                    `custom-shape-pane-${otName}`,
                );
            });
        }
    }

    shouldComponentUpdate(nextProps) {
        return (
            !isEqual(nextProps.orgUnits, this.props.orgUnits) ||
            !isEqual(getColorsFromParams(nextProps.params, this.props.params))
        );
    }

    componentDidUpdate() {
        const { orgUnits } = this.props;
        const { fittedToBounds } = this.state;
        if (
            !fittedToBounds &&
            (orgUnits.locations.length > 0 || orgUnits.shapes.length > 0)
        ) {
            this.setFittedToBound();
            this.fitToBounds();
        }
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

    fetchDetail(orgUnit) {
        const { dispatch } = this.props;
        this.props.setCurrentSubOrgUnit(null);
        fetchOrgUnitDetail(dispatch, orgUnit.id).then(i =>
            this.props.setCurrentSubOrgUnit(i),
        );
    }

    fitToBounds() {
        const { orgUnits } = this.props;
        const bounds = getOrgUnitsBounds(orgUnits);
        if (bounds) {
            this.map.leafletElement.fitBounds(bounds, boundsOptions);
        }
    }

    render() {
        const {
            orgUnits,
            currentTile,
            isClusterActive,
            intl: { formatMessage },
            params,
            baseUrl,
            classes,
            setFiltersUpdated,
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
        return (
            <Grid container spacing={0}>
                <InnerDrawer
                    withTopBorder
                    settingsOptionComponent={
                        <Fragment>
                            <TileSwitch />
                            <Divider />
                            <ClusterSwitch />
                            <Divider />
                            <Box
                                px={2}
                                className={classes.innerDrawerToolbar}
                                component="div"
                            >
                                <FiltersComponent
                                    params={params}
                                    baseUrl={baseUrl}
                                    onFilterChanged={() => setFiltersUpdated()}
                                    filters={[locationsLimit()]}
                                />
                            </Box>
                        </Fragment>
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
                        <TileLayer
                            attribution={
                                currentTile.attribution
                                    ? currentTile.attribution
                                    : ''
                            }
                            url={currentTile.url}
                        />
                        {orgUnits.shapes.map(o => (
                            <GeoJSON
                                pane={
                                    o.org_unit_type
                                        ? `custom-shape-pane-${camelCase(
                                              o.org_unit_type,
                                          )}`
                                        : 'custom-shape-pane'
                                }
                                key={o.id}
                                style={() => ({
                                    color: this.getSearchColor(o.search_index),
                                })}
                                data={o.geo_json}
                                onClick={() => this.fetchDetail(o)}
                            >
                                <OrgUnitPopupComponent />
                            </GeoJSON>
                        ))}
                        {isClusterActive &&
                            orgUnits.locations.map(
                                (orgUnitsBySearch, searchIndex) => {
                                    const color = this.getSearchColor(
                                        searchIndex,
                                    );
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
                                                isCircle
                                            />
                                        </MarkerClusterGroup>
                                    );
                                },
                            )}
                        {!isClusterActive &&
                            orgUnits.locations.map(
                                (orgUnitsBySearch, searchIndex) => (
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
                                        onMarkerClick={o => this.fetchDetail(o)}
                                        PopupComponent={OrgUnitPopupComponent}
                                        isCircle
                                    />
                                ),
                            )}
                    </Map>
                </InnerDrawer>
            </Grid>
        );
    }
}
OrgunitsMap.defaultProps = {
    baseUrl: '',
};

OrgunitsMap.propTypes = {
    orgUnits: PropTypes.object.isRequired,
    currentTile: PropTypes.object.isRequired,
    resetMapReducer: PropTypes.func.isRequired,
    isClusterActive: PropTypes.bool.isRequired,
    intl: intlShape.isRequired,
    setCurrentSubOrgUnit: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string,
    classes: PropTypes.object.isRequired,
    setFiltersUpdated: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    currentTile: state.map.currentTile,
    isClusterActive: state.map.isClusterActive,
    orgUnits: state.orgUnits.orgUnitsLocations,
    orgUnitTypes: state.orgUnits.orgUnitTypes,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    resetMapReducer: currentTile => dispatch(resetMapReducer(currentTile)),
    setCurrentSubOrgUnit: i => dispatch(setCurrentSubOrgUnit(i)),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgunitsMap)),
);
