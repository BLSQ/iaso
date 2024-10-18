import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles } from 'bluesquare-components';
import React, { FunctionComponent, useMemo, useState } from 'react';
import { MapContainer, ScaleControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';

import {
    clusterCustomMarker,
    defaultCenter,
    defaultZoom,
    getLatLngBounds,
} from '../../../../utils/map/mapUtils';

import MarkersListComponent from '../../../../components/maps/markers/MarkersListComponent';
import { CustomTileLayer } from '../../../../components/maps/tools/CustomTileLayer';
import { CustomZoomControl } from '../../../../components/maps/tools/CustomZoomControl';
import { MapToggleCluster } from '../../../../components/maps/tools/MapToggleCluster';
import { Tile } from '../../../../components/maps/tools/TilesSwitchControl';
import { Instance } from '../../types/instance';
import { InstancePopup } from '../InstancePopUp/InstancePopUp';
import { useShowWarning } from './useShowWarning';

import tiles from '../../../../constants/mapTiles';

const boundsOptions = { padding: [50, 50] };

type Props = {
    instances: Instance[];
    fetching: boolean;
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
    // This should be fixed, notification reducer as been removed a while ago
    useShowWarning({ instances, notifications: [], fetching });

    const bounds = useMemo(() => {
        if (instances) {
            return getLatLngBounds(instances);
        }
        return undefined;
    }, [instances]);

    if (fetching) return null;
    return (
        <Box className={classes.root} mt={2}>
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
                            popupProps={instance => ({
                                instanceId: instance.id,
                            })}
                            items={instances}
                            PopupComponent={InstancePopup}
                        />
                    </MarkerClusterGroup>
                )}
                {!isClusterActive && (
                    <MarkersListComponent
                        items={instances}
                        popupProps={instance => ({
                            instanceId: instance.id,
                        })}
                        PopupComponent={InstancePopup}
                    />
                )}
            </MapContainer>
        </Box>
    );
};
