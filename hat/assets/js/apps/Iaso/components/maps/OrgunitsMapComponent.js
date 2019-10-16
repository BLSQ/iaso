import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import {
    Map, TileLayer,
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { injectIntl, intlShape } from 'react-intl';

import {
    Grid,
    Divider,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import { getLatLngBounds, clusterCustomMarker, customZoomBar } from '../../utils/mapUtils';

import { resetMapReducer } from '../../redux/mapReducer';
import { setCurrentOrgUnit } from '../../redux/orgUnitsReducer';

import TileSwitch from './tools/TileSwitchComponent';
import ClusterSwitch from './tools/ClusterSwitchComponent';
import MarkersListComponent from './markers/MarkersListComponent';
import ErrorPaperComponent from '../papers/ErrorPaperComponent';
import OrgUnitPopupComponent from './popups/OrgUnitPopupComponent';
import InnerDrawer from '../nav/InnerDrawerComponent';

import { fetchOrgUnitDetail } from '../../utils/requests';

const boundsOptions = { padding: [50, 50] };

class OrgunitsMap extends Component {
    componentDidMount() {
        const {
            intl: {
                formatMessage,
            },
        } = this.props;
        const zoomBar = customZoomBar(formatMessage, () => this.fitToBounds());
        zoomBar.addTo(this.map.leafletElement);
    }

    componentWillUnmount() {
        this.props.resetMapReducer();
    }

    fetchDetail(orgUnit) {
        const {
            dispatch,
        } = this.props;
        this.props.setCurrentOrgUnit(null);
        fetchOrgUnitDetail(dispatch, orgUnit.id).then(i => this.props.setCurrentOrgUnit(i));
    }

    fitToBounds() {
        const {
            currentTile,
            orgUnits,
        } = this.props;
        const bounds = getLatLngBounds(orgUnits);
        this.map.leafletElement.fitBounds(bounds, {
            maxZoom: currentTile.maxZoom, padding: boundsOptions.padding,
        });
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
        console.log(orgUnits);
        const bounds = getLatLngBounds(orgUnits);
        if (!bounds && orgUnits.length > 0) {
            return (
                <Grid container spacing={0}>
                    <Grid item xs={3} />
                    <Grid item xs={6}>
                        <ErrorPaperComponent message={formatMessage({
                            defaultMessage: 'Cannot find an org unit with geolocation',
                            id: 'iaso.orgunits.missingGeolocation',
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
                        boundsOptions={boundsOptions}
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
                                        items={orgUnits}
                                        onMarkerClick={i => this.fetchDetail(i)}
                                        PopupComponent={OrgUnitPopupComponent}
                                    />
                                </MarkerClusterGroup>
                            )
                        }
                        {
                            !isClusterActive
                            && (
                                <MarkersListComponent
                                    items={orgUnits}
                                    onMarkerClick={i => this.fetchDetail(i)}
                                    PopupComponent={OrgUnitPopupComponent}
                                />
                            )
                        }
                    </Map>
                </InnerDrawer>
            </Grid>
        );
    }
}


OrgunitsMap.propTypes = {
    orgUnits: PropTypes.array.isRequired,
    currentTile: PropTypes.object.isRequired,
    resetMapReducer: PropTypes.func.isRequired,
    isClusterActive: PropTypes.bool.isRequired,
    intl: intlShape.isRequired,
    setCurrentOrgUnit: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    currentTile: state.map.currentTile,
    isClusterActive: state.map.isClusterActive,
    orgUnits: state.orgUnits.orgUnitsLocations,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    resetMapReducer: currentTile => dispatch(resetMapReducer(currentTile)),
    setCurrentOrgUnit: i => dispatch(setCurrentOrgUnit(i)),
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgunitsMap));
