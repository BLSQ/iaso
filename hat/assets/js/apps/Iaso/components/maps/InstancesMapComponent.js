import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    Map, TileLayer,
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';

import {
    withStyles,
    Grid,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import { getLatLngBounds, createClusterCustomIcon } from '../../utils/mapUtils';

import { resetMapReducer } from '../../redux/mapReducer';

import TileSwitch from './TileSwitchComponent';
import ClusterSwitch from './ClusterSwitchComponent';
import InstancesMarkersComponent from './InstancesMarkersComponent';

import commonStyles from '../../styles/common';

const styles = theme => ({
    ...commonStyles(theme),
});

const boundsOptions = { padding: [50, 50] };

class InstancesMap extends Component {
    componentWillUnmount() {
        this.props.resetMapReducer();
    }

    render() {
        const {
            instances, classes, currentTile, isClusterActive,
        } = this.props;
        return (
            <Grid container spacing={4}>
                <Grid item xs={9} xl={10} className={classes.mapContainer}>
                    <Map
                        scrollWheelZoom={false}
                        maxZoom={currentTile.maxZoom}
                        style={{ height: '100%' }}
                        bounds={getLatLngBounds(instances)}
                        boundsOptions={boundsOptions}
                        zoom={13}
                    >
                        <TileLayer
                            attribution={currentTile.attribution ? currentTile.attribution : ''}
                            url={currentTile.url}
                        />
                        {
                            isClusterActive
                            && (
                                <MarkerClusterGroup iconCreateFunction={createClusterCustomIcon}>
                                    <InstancesMarkersComponent instances={instances} />
                                </MarkerClusterGroup>
                            )
                        }
                        {
                            !isClusterActive
                            && <InstancesMarkersComponent instances={instances} />
                        }
                    </Map>
                </Grid>
                <Grid item xs={3} xl={2}>
                    <TileSwitch />
                    <ClusterSwitch />
                </Grid>
            </Grid>
        );
    }
}


InstancesMap.propTypes = {
    classes: PropTypes.object.isRequired,
    instances: PropTypes.array.isRequired,
    currentTile: PropTypes.object.isRequired,
    resetMapReducer: PropTypes.func.isRequired,
    isClusterActive: PropTypes.bool.isRequired,
};

const MapStateToProps = state => ({
    currentTile: state.map.currentTile,
    isClusterActive: state.map.isClusterActive,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    resetMapReducer: currentTile => dispatch(resetMapReducer(currentTile)),
});


export default withStyles(styles)(connect(MapStateToProps, MapDispatchToProps)(InstancesMap));
