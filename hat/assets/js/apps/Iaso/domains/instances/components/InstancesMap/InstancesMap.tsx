import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { commonStyles } from 'bluesquare-components';
import { useDispatch, useSelector } from 'react-redux';
import { MapContainer, ScaleControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';

import {
    getLatLngBounds,
    clusterCustomMarker,
    defaultCenter,
    defaultZoom,
} from '../../../../utils/map/mapUtils';

import MarkersListComponent from '../../../../components/maps/markers/MarkersListComponent';
import { useShowWarning } from './useShowWarning';
import { setCurrentInstance } from '../../actions';
import { fetchInstanceDetail } from '../../../../utils/requests';
import { Instance } from '../../types/instance';
import { InstancePopup } from '../InstancePopUp/InstancePopUp';
import { Tile } from '../../../../components/maps/tools/TilesSwitchControl';
import { CustomTileLayer } from '../../../../components/maps/tools/CustomTileLayer';
import { CustomZoomControl } from '../../../../components/maps/tools/CustomZoomControl';
import { MapToggleCluster } from '../../../../components/maps/tools/MapToggleCluster';

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

const useStyles = makeStyles(theme => ({
    root: {
        ...commonStyles(theme).mapContainer,
        position: 'relative',
    },
}));
export const InstancesMap: FunctionComponent<Props> = ({
    instances,
    fetching,
}) => {
    const classes = useStyles();
    const [isClusterActive, setIsClusterActive] = useState<boolean>(true);
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

    const bounds = useMemo(() => {
        if (instances) {
            return getLatLngBounds(instances);
        }
        return undefined;
    }, [instances]);

    if (fetching) return null;
    return (
        <Box className={classes.root}>
            <MapToggleCluster
                isClusterActive={isClusterActive}
                setIsClusterActive={setIsClusterActive}
            />
            <MapContainer
                scrollWheelZoom={false}
                maxZoom={currentTile.maxZoom}
                style={{ height: '80vh' }}
                bounds={bounds}
                boundsOptions={boundsOptions}
                zoom={defaultZoom}
                center={defaultCenter}
                zoomControl={false}
                keyboard={false}
            >
                <ScaleControl imperial={false} />
                <CustomTileLayer
                    currentTile={currentTile}
                    setCurrentTile={setCurrentTile}
                />
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
        </Box>
    );
};
