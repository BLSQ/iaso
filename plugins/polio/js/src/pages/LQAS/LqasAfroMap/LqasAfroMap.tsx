import React, { FunctionComponent, useState } from 'react';

import { Box } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { MapContainer } from 'react-leaflet';

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

type Props = {
    round: 'latest' | string;
};

export const LqasAfroMap: FunctionComponent<Props> = ({ round = 'latest' }) => {
    const { formatMessage } = useSafeIntl();
    const [currentTile, setCurrentTile] = useState<Tile>(TILES.osm);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.calendar)}
                displayBackButton={false}
            />
            <Box position="relative">
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
                    scrollWheelZoom={false}
                >
                    <CustomTileLayer
                        currentTile={currentTile}
                        setCurrentTile={setCurrentTile}
                    />
                    <LqasAfroMapPanesContainer round="2" />
                </MapContainer>
            </Box>
        </>
    );
};
