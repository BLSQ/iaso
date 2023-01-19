import React, { Component, FunctionComponent, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Map, ScaleControl, TileLayer } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { Grid, Divider } from '@material-ui/core';

import {
    getLatLngBounds,
    clusterCustomMarker,
    ZoomControl,
    defaultCenter,
    defaultZoom,
} from '../../../../utils/mapUtils';

import { resetMapReducer } from '../../../../redux/mapReducer';
import { setCurrentInstance } from '../../actions';

import TileSwitch from '../../../../components/maps/tools/TileSwitchComponent';
import ClusterSwitch from '../../../../components/maps/tools/ClusterSwitchComponent';
import MarkersListComponent from '../../../../components/maps/markers/MarkersListComponent';
import InnerDrawer from '../../../../components/nav/InnerDrawer';

import InstancePopupComponent from '../InstancePopupComponent';
import { warningSnackBar } from '../../../../constants/snackBars';
import {
    enqueueSnackbar,
    closeFixedSnackbar,
} from '../../../../redux/snackBarsReducer';

import { fetchInstanceDetail } from '../../../../utils/requests';
import { useShowWarning } from './useShowWarning';
import { useResetMapReducerOnUnmount } from './useResetMapReducerOnUnmount';

const boundsOptions = { padding: [50, 50] };

const snackbarKey = 'noInstancesOnMap';

type Props = {
    instances:any,
    currentTile:any,
    isClusterActive:any,
    fetching:any, notifications:any[]
}

export const InstancesMap:FunctionComponent<Props> = ({instances, currentTile, isClusterActive,notifications, fetching}) => {
    const map = useRef()
    useShowWarning({instances,
        notifications,
        fetching,});

    useResetMapReducerOnUnmount()
 




    fetchDetail(instance) {
        const { dispatch } = this.props;
        this.props.setCurrentInstance(null);
        fetchInstanceDetail(dispatch, instance.id).then(i =>
            this.props.setCurrentInstance(i),
        );
    }

    fitToBounds() {
        const { currentTile, instances } = this.props;
        const bounds = getLatLngBounds(instances);
        this.map.leafletElement.fitBounds(bounds, {
            maxZoom: currentTile.maxZoom,
            padding: boundsOptions.padding,
        });
    }

    render() {
       
        if (fetching) return null;
        const bounds = getLatLngBounds(instances);
        if (this.map) {
            this.map.leafletElement.options.maxZoom = currentTile.maxZoom;
        }
        return (
            <Grid container spacing={0}>
                <InnerDrawer
                    withTopBorder
                    settingsOptionComponent={
                        <>
                            <TileSwitch />
                            <Divider />
                            <ClusterSwitch />
                        </>
                    }
                >
                    <Map
                        ref={ref => {
                            this.map = ref;
                        }}
                        scrollWheelZoom={false}
                        maxZoom={currentTile.maxZoom}
                        style={{ height: '100%' }}
                        bounds={bounds}
                        boundsOptions={boundsOptions}
                        zoom={defaultZoom}
                        center={defaultCenter}
                        zoomControl={false}
                        keyboard={false}
                    >
                        <ZoomControl fitToBounds={() => this.fitToBounds()} />
                        <ScaleControl imperial={false} />
                        <TileLayer
                            attribution={
                                currentTile.attribution
                                    ? currentTile.attribution
                                    : ''
                            }
                            url={currentTile.url}
                        />
                        {isClusterActive && (
                            <MarkerClusterGroup
                                iconCreateFunction={clusterCustomMarker}
                            >
                                <MarkersListComponent
                                    items={instances}
                                    onMarkerClick={i => this.fetchDetail(i)}
                                    PopupComponent={InstancePopupComponent}
                                />
                            </MarkerClusterGroup>
                        )}
                        {!isClusterActive && (
                            <MarkersListComponent
                                items={instances}
                                onMarkerClick={i => this.fetchDetail(i)}
                                PopupComponent={InstancePopupComponent}
                            />
                        )}
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
    setCurrentInstance: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    fetching: PropTypes.bool.isRequired,
    notifications: PropTypes.array.isRequired,
};

const MapStateToProps = state => ({
    currentTile: state.map.currentTile,
    isClusterActive: state.map.isClusterActive,
    notifications: state.snackBar ? state.snackBar.notifications : [],
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    resetMapReducer: currentTile => dispatch(resetMapReducer(currentTile)),
    setCurrentInstance: i => dispatch(setCurrentInstance(i)),
});

export default connect(MapStateToProps, MapDispatchToProps)(InstancesMap);
