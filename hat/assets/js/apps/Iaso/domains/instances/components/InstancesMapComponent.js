import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
    Map, TileLayer,
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { injectIntl, intlShape } from 'react-intl';
import isEqual from 'lodash/isEqual';

import {
    Grid,
    Divider,
} from '@material-ui/core';


import { getLatLngBounds, clusterCustomMarker, customZoomBar } from '../../../utils/mapUtils';

import { resetMapReducer } from '../../../redux/mapReducer';
import { setCurrentInstance } from '../actions';

import TileSwitch from '../../../components/maps/tools/TileSwitchComponent';
import ClusterSwitch from '../../../components/maps/tools/ClusterSwitchComponent';
import MarkersListComponent from '../../../components/maps/markers/MarkersListComponent';
import InstancePopupComponent from './InstancePopupComponent';
import InnerDrawer from '../../../components/nav/InnerDrawerComponent';
import { warningSnackBar } from '../../../../../utils/constants/snackBars';
import { enqueueSnackbar, closeFixedSnackbar } from '../../../../../redux/snackBarsReducer';

import { fetchInstanceDetail } from '../../../utils/requests';

const boundsOptions = { padding: [50, 50] };

class InstancesMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
            warningDisplayed: false,
        };
    }

    componentDidUpdate() {
        const {
            instances,
            dispatch,
            fetching,
        } = this.props;
        const bounds = getLatLngBounds(instances);
        const { warningDisplayed } = this.state;
        if (!fetching && instances.length > 0) {
            if (!bounds && !warningDisplayed) {
                this.toggleWarning(true);
                dispatch(enqueueSnackbar(warningSnackBar('noInstancesOnMap')));
            } else if (bounds && warningDisplayed) {
                this.toggleWarning(false);
                dispatch(closeFixedSnackbar('noInstancesOnMap'));
            }
        }
    }

    componentWillUnmount() {
        this.props.resetMapReducer();
    }


    onMapLoaded(ref) {
        this.map = ref;
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

    toggleWarning(warningDisplayed) {
        this.setState({
            warningDisplayed,
        });
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
            fetching,
        } = this.props;
        if (fetching) return null;
        const bounds = getLatLngBounds(instances);
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
                        ref={ref => this.onMapLoaded(ref)}
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
