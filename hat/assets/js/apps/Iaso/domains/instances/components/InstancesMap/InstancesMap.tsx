import React, { FunctionComponent, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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

import TileSwitch from '../../../../components/maps/tools/TileSwitchComponent';
import ClusterSwitch from '../../../../components/maps/tools/ClusterSwitchComponent';
import MarkersListComponent from '../../../../components/maps/markers/MarkersListComponent';
import InnerDrawer from '../../../../components/nav/InnerDrawer';

import InstancePopupComponent from '../InstancePopupComponent';

import { useShowWarning } from './useShowWarning';
import { useResetMapReducerOnUnmount } from './useResetMapReducerOnUnmount';
import { setCurrentInstance } from '../../actions';
import { fetchInstanceDetail } from '../../../../utils/requests';
import { Instance } from '../../types/instance';

const boundsOptions = { padding: [50, 50] };

type Props = {
    instances: Instance[];
    fetching: boolean;
};

export const InstancesMap: FunctionComponent<Props> = ({
    instances,
    fetching,
}) => {
    const map: any = useRef();
    // @ts-ignore
    const isClusterActive = useSelector(state => state.map.isClusterActive);
    // @ts-ignore
    const currentTile = useSelector(state => state.map.currentTile);
    const notifications = useSelector(state =>
        // @ts-ignore
        state.snackBar ? state.snackBar.notifications : [],
    );

    const dispatch = useDispatch();
    const dispatchInstance = useCallback(
        instance => {
            dispatch(setCurrentInstance(instance));
        },
        [dispatch],
    );
    // We need redux here for the PopUp. Refactoring the pop up may be complex since it is used in MarkerClusterGroup,
    // which is itself widely used
    const fetchAndDispatchDetail = useCallback(
        instance => {
            dispatchInstance(null);
            fetchInstanceDetail(dispatch, instance.id).then((i: Instance) =>
                dispatchInstance(i),
            );
        },
        [dispatch, dispatchInstance],
    );
    useShowWarning({ instances, notifications, fetching });

    useResetMapReducerOnUnmount();

    const fitToBounds = useCallback(() => {
        const bounds = getLatLngBounds(instances);
        map.current?.leafletElement.fitBounds(bounds, {
            maxZoom: currentTile.maxZoom,
            padding: boundsOptions.padding,
        });
    }, [instances, currentTile]);

    const bounds = useMemo(() => {
        if (instances) {
            return getLatLngBounds(instances);
        }
        return undefined;
    }, [instances]);

    if (fetching) return null;
    if (map.current) {
        map.current.leafletElement.options.maxZoom = currentTile.maxZoom;
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
                        map.current = ref;
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
                    <ZoomControl fitToBounds={() => fitToBounds()} />
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
                                onMarkerClick={fetchAndDispatchDetail}
                                PopupComponent={InstancePopupComponent}
                            />
                        </MarkerClusterGroup>
                    )}
                    {!isClusterActive && (
                        <MarkersListComponent
                            items={instances}
                            onMarkerClick={fetchAndDispatchDetail}
                            PopupComponent={InstancePopupComponent}
                        />
                    )}
                </Map>
            </InnerDrawer>
        </Grid>
    );
};
