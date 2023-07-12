import React, { FunctionComponent } from 'react';
import { MapContainer } from 'react-leaflet';

import { CustomZoomControl } from '../../../../../../../../hat/assets/js/apps/Iaso/components/maps/tools/CustomZoomControl';
import TILES from '../../../../../../../../hat/assets/js/apps/Iaso/constants/mapTiles';

import { defaultViewport } from '../../../../components/campaignCalendar/map/constants';
import { CustomTileLayer } from '../../../../../../../../hat/assets/js/apps/Iaso/components/maps/tools/CustomTileLayer';
import {
    TilesSwitchControl,
    Tile,
} from '../../../../../../../../hat/assets/js/apps/Iaso/components/maps/tools/TilesSwitchControl';
import { LqasAfroMapPanesContainer } from './LqasAfroMapPanesContainer';
import { AfroMapParams, Side } from '../types';
import { Router } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { LqasAfroMapLegend } from './LqasAfroMapLegend';

type Props = {
    router: Router;
    currentTile: Tile;
    setCurrentTile: React.Dispatch<React.SetStateAction<Tile>>;
    side: Side;
};

export const LqasAfroMap: FunctionComponent<Props> = ({
    router,
    currentTile,
    setCurrentTile,
    side,
}) => {
    return (
        <>
            <TilesSwitchControl
                currentTile={currentTile}
                setCurrentTile={setCurrentTile}
            />
            <MapContainer
                style={{
                    height: '65vh',
                }}
                center={defaultViewport.center}
                zoom={defaultViewport.zoom}
                zoomControl={false}
                scrollWheelZoom={false}
            >
                <LqasAfroMapLegend />
                <CustomTileLayer
                    currentTile={currentTile}
                    setCurrentTile={setCurrentTile}
                />
                <CustomZoomControl
                    boundsOptions={{ maxZoom: TILES.osm.maxZoom }}
                />
                <LqasAfroMapPanesContainer
                    params={router.params as AfroMapParams}
                    side={side}
                />
            </MapContainer>
        </>
    );
};
