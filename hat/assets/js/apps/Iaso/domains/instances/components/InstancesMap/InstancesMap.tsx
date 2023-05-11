import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MapContainer, ScaleControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { Grid, Divider } from '@material-ui/core';

import {
    getLatLngBounds,
    clusterCustomMarker,
    // ZoomControl,
    defaultCenter,
    defaultZoom,
} from '../../../../utils/mapUtils';

import TileSwitch from '../../../../components/maps/tools/TileSwitchComponent';
import ClusterSwitch from '../../../../components/maps/tools/ClusterSwitchComponent';
import MarkersListComponent from '../../../../components/maps/markers/MarkersListComponent';
import InnerDrawer from '../../../../components/nav/InnerDrawer';
import { useShowWarning } from './useShowWarning';
import { useResetMapReducerOnUnmount } from './useResetMapReducerOnUnmount';
import { setCurrentInstance } from '../../actions';
import { fetchInstanceDetail } from '../../../../utils/requests';
import { Instance } from '../../types/instance';
import { InstancePopup } from '../InstancePopUp/InstancePopUp';
import { Tile } from '../../../../components/maps/tools/TileSwitch';
import { TilesSwitchDialog } from '../../../../components/maps/tools/TilesSwitchDialog';
import { CustomTileLayer } from '../../../../components/maps/CustomTileLayer';
import { CustomZoomControl } from '../../../../components/maps/CustomZoomControl';
import tiles from '../../../../constants/mapTiles';

const boundsOptions = { padding: [50, 50] };

type Props = {
    instances: Instance[];
    fetching: boolean;
};

type PartialReduxState = {
    map: { isClusterActive: boolean; currentTile: Tile };
    snackBar: { notifications: any[] };
};

export const InstancesMap: FunctionComponent<Props> = ({
    instances,
    fetching,
}) => {
    const isClusterActive = useSelector(
        (state: PartialReduxState) => state.map.isClusterActive,
    );
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    const notifications = useSelector((state: PartialReduxState) =>
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

    const bounds = useMemo(() => {
        if (instances) {
            return getLatLngBounds(instances);
        }
        return undefined;
    }, [instances]);

    if (fetching) return null;
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
                <TilesSwitchDialog
                    currentTile={currentTile}
                    setCurrentTile={setCurrentTile}
                />
                <MapContainer
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
                    <ScaleControl imperial={false} />
                    <CustomTileLayer currentTile={currentTile} />
                    <CustomZoomControl
                        bounds={bounds}
                        boundsOptions={boundsOptions}
                        fitOnLoad
                    />
                    {isClusterActive && (
                        <MarkerClusterGroup
                            iconCreateFunction={clusterCustomMarker}
                        >
                            <MarkersListComponent
                                items={instances}
                                onMarkerClick={fetchAndDispatchDetail}
                                PopupComponent={InstancePopup}
                            />
                        </MarkerClusterGroup>
                    )}
                    {!isClusterActive && (
                        <MarkersListComponent
                            items={instances}
                            onMarkerClick={fetchAndDispatchDetail}
                            PopupComponent={InstancePopup}
                        />
                    )}
                </MapContainer>
            </InnerDrawer>
        </Grid>
    );
};
