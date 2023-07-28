import React, { FunctionComponent, useState, useMemo } from 'react';
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
    const { params } = router;
    const defaultCenter = useMemo(
        () =>
            (side === 'left'
                ? params.centerLeft && JSON.parse(params.centerLeft)
                : params.centerRight && JSON.parse(params.centerRight)) ||
            defaultViewport.center,
        [params.centerLeft, params.centerRight, side],
    );
    const defaultZoom = useMemo(
        () =>
            (side === 'left' ? params.zoomLeft : params.zoomRight) ||
            defaultViewport.zoom,
        [params.zoomLeft, params.zoomRight, side],
    );
    const displayedShape: string = useMemo(
        () =>
            (side === 'left'
                ? params.displayedShapesLeft
                : params.displayedShapesRight) || 'country',
        [params.displayedShapesLeft, params.displayedShapesRight, side],
    );
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
                center={defaultCenter}
                zoom={defaultZoom}
                zoomControl={false}
                scrollWheelZoom={false}
                whenCreated={mapInstance => {
                    setBounds(mapInstance.getBounds());
                }}
            >
                <LqasAfroMapLegend displayedShape={displayedShape} />
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
