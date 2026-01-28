import React, { FunctionComponent, useState, useMemo, useContext } from 'react';
import { MapContainer } from 'react-leaflet';

import { CustomTileLayer } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/maps/tools/CustomTileLayer';
import { CustomZoomControl } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/maps/tools/CustomZoomControl';
import { Tile } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/maps/tools/TilesSwitchControl';
import TILES from '../../../../../../../../../hat/assets/js/apps/Iaso/constants/mapTiles';

import { Side } from '../../../../../../src/constants/types';
import { defaultViewport } from '../../../../Calendar/campaignCalendar/map/constants';
import { LqasAfroOverviewContext } from '../Context/LqasAfroOverviewContext';
import { AfroMapParams } from '../types';
import { LqasAfroMapLegend } from './LqasAfroMapLegend';
import { LqasAfroMapPanesContainer } from './LqasAfroMapPanesContainer';

type Props = {
    params: AfroMapParams & { accountId: string };
    side: Side;
    currentUrl: string;
};

export const LqasAfroMap: FunctionComponent<Props> = ({
    params,
    side,
    currentUrl,
}) => {
    const { bounds } = useContext(LqasAfroOverviewContext);
    const [currentTile, setCurrentTile] = useState<Tile>(TILES.osm);
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
        <MapContainer
            style={{
                height: '65vh',
            }}
            center={defaultCenter}
            zoom={Number(defaultZoom)}
            zoomControl={false}
            scrollWheelZoom={false}
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
                params={params}
                side={side}
                currentUrl={currentUrl}
            />
        </MapContainer>
    );
};
