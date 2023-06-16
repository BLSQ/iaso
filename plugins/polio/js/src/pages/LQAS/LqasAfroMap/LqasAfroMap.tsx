import React, { FunctionComponent, useState } from 'react';

import { Box } from '@material-ui/core';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import { MapContainer } from 'react-leaflet';

import { defaultShapeStyle } from '../../../utils/index';
import MESSAGES from '../../../constants/messages';
import { useGetCountriesGeoJson } from '../../../hooks/useGetGeoJson';
import TILES from '../../../../../../../hat/assets/js/apps/Iaso/constants/mapTiles';

import { defaultViewport } from '../../../components/campaignCalendar/map/constants';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useGetCountriesLqasStatus } from './useGetCountriesLqasStatus';
import { CustomTileLayer } from '../../../../../../../hat/assets/js/apps/Iaso/components/maps/tools/CustomTileLayer';
import {
    Tile,
    TilesSwitchDialog,
} from '../../../../../../../hat/assets/js/apps/Iaso/components/maps/tools/TilesSwitchDialog';
import { LqasAfroMapPanesContainer } from './LqasAfroMapPanesContainer';
import { useAfroMapShapes } from './useAfroMapShapes';

// const defaultShapes = [];

type Props = {
    round: 'latest' | string;
};

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
const getBackgroundLayerStyle = _shape => defaultShapeStyle;

export const LqasAfroMap: FunctionComponent<Props> = ({ round = 'latest' }) => {
    const { formatMessage } = useSafeIntl();
    const [currentTile, setCurrentTile] = useState<Tile>(TILES.osm);
    const { data: mapShapes, isFetching: isAfroShapesLoading } =
        useAfroMapShapes('lqas');

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.calendar)}
                displayBackButton={false}
            />
            <Box position="relative">
                {isAfroShapesLoading && (
                    <LoadingSpinner fixed={false} absolute />
                )}
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

                    <LqasAfroMapPanesContainer
                        countriesWithStatus={mapShapes}
                    />
                </MapContainer>
            </Box>
        </>
    );
};
