import React, { FunctionComponent, useState } from 'react';
import { MapContainer } from 'react-leaflet';

import { Bounds } from '../../../../../../../../hat/assets/js/apps/Iaso/utils/map/mapUtils';
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
    const [bounds, setBounds] = useState<Bounds | undefined>(undefined);
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
                // @ts-ignore
                center={defaultViewport.center}
                zoom={defaultViewport.zoom}
                zoomControl={false}
                scrollWheelZoom={false}
                whenCreated={mapInstance => {
                    setBounds(mapInstance.getBounds());
                }}
            >
                <LqasAfroMapLegend />
                <CustomTileLayer
                    currentTile={currentTile}
                    setCurrentTile={setCurrentTile}
                />
                {bounds && (
                    <CustomZoomControl
                        boundsOptions={{ maxZoom: TILES.osm.maxZoom }}
                        bounds={bounds}
                    />
                )}
                <LqasAfroMapPanesContainer
                    params={router.params as AfroMapParams}
                    side={side}
                />
            </MapContainer>
        </>
    );
};
