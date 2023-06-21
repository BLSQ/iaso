import React, { FunctionComponent, useState } from 'react';
import { Box } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { MapContainer } from 'react-leaflet';

import { CustomZoomControl } from '../../../../../../../hat/assets/js/apps/Iaso/components/maps/tools/CustomZoomControl';
import MESSAGES from '../../../constants/messages';
import TILES from '../../../../../../../hat/assets/js/apps/Iaso/constants/mapTiles';

import { defaultViewport } from '../../../components/campaignCalendar/map/constants';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { CustomTileLayer } from '../../../../../../../hat/assets/js/apps/Iaso/components/maps/tools/CustomTileLayer';
import {
    Tile,
    TilesSwitchControl,
} from '../../../../../../../hat/assets/js/apps/Iaso/components/maps/tools/TilesSwitchControl';
import { LqasAfroMapPanesContainer } from './LqasAfroMapPanesContainer';
import { LqasAfroMapFilters } from './Filters/LqasAfroMapFilters';
import { useStyles } from '../../../styles/theme';
import { Router } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { AfroMapParams } from './types';

type Props = {
    router: Router;
};
export const LqasAfroMap: FunctionComponent<Props> = ({ router }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const [currentTile, setCurrentTile] = useState<Tile>(TILES.osm);
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.lqasMap)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <LqasAfroMapFilters params={router.params as AfroMapParams} />
                <Box position="relative" mt={2}>
                    <TilesSwitchControl
                        currentTile={currentTile}
                        setCurrentTile={setCurrentTile}
                    />
                    <MapContainer
                        style={{
                            height: '72vh',
                        }}
                        center={defaultViewport.center}
                        zoom={defaultViewport.zoom}
                        zoomControl={false}
                        scrollWheelZoom={false}
                    >
                        <CustomTileLayer
                            currentTile={currentTile}
                            setCurrentTile={setCurrentTile}
                        />
                        <CustomZoomControl
                            boundsOptions={{ maxZoom: TILES.osm.maxZoom }}
                        />
                        <LqasAfroMapPanesContainer
                            params={router.params as AfroMapParams}
                        />
                    </MapContainer>
                </Box>
            </Box>
        </>
    );
};
