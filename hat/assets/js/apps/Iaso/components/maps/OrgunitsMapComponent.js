import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import {
    Map, TileLayer, GeoJSON,
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { injectIntl, intlShape } from 'react-intl';
import camelCase from 'lodash/camelCase';

import {
    Grid,
    Divider,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import {
    getLatLngBounds,
    getShapesBounds,
    clusterCustomMarker,
    customZoomBar,
} from '../../utils/mapUtils';

import { resetMapReducer } from '../../redux/mapReducer';
import { setCurrentSubOrgUnit } from '../../redux/orgUnitsReducer';

import TileSwitch from './tools/TileSwitchComponent';
import ClusterSwitch from './tools/ClusterSwitchComponent';
import MarkersListComponent from './markers/MarkersListComponent';
import ErrorPaperComponent from '../papers/ErrorPaperComponent';
import OrgUnitPopupComponent from './popups/OrgUnitPopupComponent';
import InnerDrawer from '../nav/InnerDrawerComponent';

import { fetchOrgUnitDetail } from '../../utils/requests';

const getOrgUnitsBounds = (orgUnits) => {
    const locationsBounds = orgUnits.locations.length > 0 ? getLatLngBounds(orgUnits.locations) : null;
    const shapeBounds = orgUnits.shapes.length > 0 ? getShapesBounds(orgUnits.shapes) : null;
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
    componentDidMount() {
        const {
            orgUnitTypes,
            intl: {
                formatMessage,
            },
        } = this.props;
        const zoomBar = customZoomBar(formatMessage, () => this.fitToBounds());
        zoomBar.addTo(this.map.leafletElement);
        if (orgUnitTypes.length === 0) {
            this.map.leafletElement.createPane('custom-shape-pane');
        } else {
            orgUnitTypes.forEach((ot) => {
                const otName = camelCase(ot.name);
                this.map.leafletElement.createPane(`custom-shape-pane-${otName}`);
            });
        }
    }

    componentWillUnmount() {
        this.props.resetMapReducer();
    }

    fetchDetail(orgUnit) {
        const {
            dispatch,
        } = this.props;
        this.props.setCurrentSubOrgUnit(null);
        fetchOrgUnitDetail(dispatch, orgUnit.id).then(i => this.props.setCurrentSubOrgUnit(i));
    }

    fitToBounds() {
        const {
            currentTile,
            orgUnits,
        } = this.props;
        const bounds = getOrgUnitsBounds(orgUnits);
        if (bounds) {
            this.map.leafletElement.fitBounds(bounds, {
                maxZoom: currentTile.maxZoom,
            });
        }
    }

    render() {
        const {
            orgUnits,
            currentTile,
            isClusterActive,
            intl: {
                formatMessage,
            },
        } = this.props;
        const bounds = getOrgUnitsBounds(orgUnits);
        if (!bounds && orgUnits.locations.length > 0) {
            return (
                <Grid container spacing={0}>
                    <Grid item xs={3} />
                    <Grid item xs={6}>
                        <ErrorPaperComponent message={formatMessage({
                            defaultMessage: 'Cannot find an org unit with geolocation',
                            id: 'iaso.orgUnits.missingGeolocation',
                        })}
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
                    settingsOptionComponent={(
                        <Fragment>
                            <TileSwitch />
                            <Divider />
                            <ClusterSwitch />
                        </Fragment>
                    )}
                >
                    <Map
                        ref={(ref) => {
                            this.map = ref;
                        }}
                        scrollWheelZoom={false}
                        maxZoom={currentTile.maxZoom}
                        style={{ height: '100%' }}
                        bounds={bounds}
                        boundsOptions={{
                            maxZoom: currentTile.maxZoom,
                        }}
                        zoom={13}
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution={currentTile.attribution ? currentTile.attribution : ''}
                            url={currentTile.url}
                        />
                        {
                            isClusterActive
                            && (
                                <MarkerClusterGroup iconCreateFunction={clusterCustomMarker}>
                                    <MarkersListComponent
                                        items={orgUnits.locations}
                                        onMarkerClick={o => this.fetchDetail(o)}
                                        PopupComponent={OrgUnitPopupComponent}
                                    />
                                </MarkerClusterGroup>
                            )
                        }
                        {
                            !isClusterActive
                            && (
                                <MarkersListComponent
                                    items={orgUnits.locations}
                                    onMarkerClick={o => this.fetchDetail(o)}
                                    PopupComponent={OrgUnitPopupComponent}
                                />
                            )
                        }
                        {
                            orgUnits.shapes.map(o => (
                                <GeoJSON
                                    pane={o.org_unit_type
                                        ? `custom-shape-pane-${camelCase(o.org_unit_type)}`
                                        : 'custom-shape-pane'}
                                    // className="primary"
                                    key={o.id}
                                    data={o.geo_json}
                                    onClick={() => this.fetchDetail(o)}
                                >
                                    <OrgUnitPopupComponent />
                                </GeoJSON>
                            ))
                        }
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
    intl: intlShape.isRequired,
    setCurrentSubOrgUnit: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
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


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgunitsMap));
