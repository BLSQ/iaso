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
import { setCurrentInstance } from '../../redux/instancesReducer';

import TileSwitch from './tools/TileSwitchComponent';
import ClusterSwitch from './tools/ClusterSwitchComponent';
import MarkersListComponent from './markers/MarkersListComponent';
import ErrorPaperComponent from '../papers/ErrorPaperComponent';
import InstancePopupComponent from './popups/InstancePopupComponent';
import InnerDrawer from '../nav/InnerDrawerComponent';

import { fetchInstanceDetail } from '../../utils/requests';

const boundsOptions = { padding: [50, 50] };

class InstancesMap extends Component {
    componentDidMount() {
        const {
            intl: {
                formatMessage,
            },
        } = this.props;
        const zoomBar = customZoomBar(formatMessage, () => this.fitToBounds());
        if (this.map) {
            zoomBar.addTo(this.map.leafletElement);
        }
    }

    componentWillUnmount() {
        this.props.resetMapReducer();
    }

    fetchDetail(instance) {
        const {
            dispatch,
        } = this.props;
        this.props.setCurrentInstance(null);
        fetchInstanceDetail(dispatch, instance.id).then(i => this.props.setCurrentInstance(i));
    }

    fitToBounds() {
        const {
            currentTile,
            instances,
        } = this.props;
        const bounds = getLatLngBounds(instances);
        this.map.leafletElement.fitBounds(bounds, {
            maxZoom: currentTile.maxZoom, padding: boundsOptions.padding,
        });
    }

    render() {
        const {
            instances,
            currentTile,
            isClusterActive,
            intl: {
                formatMessage,
            },
            fetching,
        } = this.props;
        if (fetching) return null;
        const bounds = getLatLngBounds(instances);
        if (!bounds) {
            return (
                <Grid container spacing={0}>
                    <Grid item xs={3} />
                    <Grid item xs={6}>
                        <ErrorPaperComponent message={formatMessage({
                            defaultMessage: 'Cannot find an instance with geolocation',
                            id: 'iaso.instance.missingGeolocation',
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
                        boundsOptions={boundsOptions}
                        zoom={13}
                        zoomControl={false}
                        keyboard={false}
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
                                        items={instances}
                                        onMarkerClick={i => this.fetchDetail(i)}
                                        PopupComponent={InstancePopupComponent}
                                    />
                                </MarkerClusterGroup>
                            )
                        }
                        {
                            !isClusterActive
                            && (
                                <MarkersListComponent
                                    items={instances}
                                    onMarkerClick={i => this.fetchDetail(i)}
                                    PopupComponent={InstancePopupComponent}
                                />
                            )
                        }
                    </Map>
                </InnerDrawer>
            </Grid>
        );
    }
}


InstancesMap.propTypes = {
    instances: PropTypes.array.isRequired,
    currentTile: PropTypes.object.isRequired,
    resetMapReducer: PropTypes.func.isRequired,
    isClusterActive: PropTypes.bool.isRequired,
    intl: intlShape.isRequired,
    setCurrentInstance: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    fetching: PropTypes.bool.isRequired,
};

const MapStateToProps = state => ({
    currentTile: state.map.currentTile,
    isClusterActive: state.map.isClusterActive,
    fetching: state.instances.fetching,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    resetMapReducer: currentTile => dispatch(resetMapReducer(currentTile)),
    setCurrentInstance: i => dispatch(setCurrentInstance(i)),
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(InstancesMap));
