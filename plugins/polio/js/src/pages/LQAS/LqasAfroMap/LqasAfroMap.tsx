import React, { FunctionComponent, useState } from 'react';

import { Box } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { MapContainer } from 'react-leaflet';

import { defaultShapeStyle } from '../../../utils/index';
import MESSAGES from '../../../constants/messages';
import TILES from '../../../../../../../hat/assets/js/apps/Iaso/constants/mapTiles';

import { defaultViewport } from '../../../components/campaignCalendar/map/constants';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { CustomTileLayer } from '../../../../../../../hat/assets/js/apps/Iaso/components/maps/tools/CustomTileLayer';
import {
    Tile,
    TilesSwitchDialog,
} from '../../../../../../../hat/assets/js/apps/Iaso/components/maps/tools/TilesSwitchDialog';
import { LqasAfroMapPanesContainer } from './LqasAfroMapPanesContainer';

// const defaultShapes = [];

type Props = {
    round: 'latest' | string;
};

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
const getBackgroundLayerStyle = _shape => defaultShapeStyle;

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
                <TilesSwitchDialog
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
                    <CustomTileLayer currentTile={currentTile} />
                    <LqasAfroMapPanesContainer />
                </MapContainer>
            </Box>
        </>
    );
};
