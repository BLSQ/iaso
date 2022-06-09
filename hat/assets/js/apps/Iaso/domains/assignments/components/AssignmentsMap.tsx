import React, { FunctionComponent, useRef, useState } from 'react';
import { Map, TileLayer } from 'react-leaflet';
import { Box } from '@material-ui/core';

import { ZoomControl } from '../../../utils/mapUtils';
import tiles from '../../../constants/mapTiles';

import { AssignmentsApi } from '../types/assigment';
import { TilesSwitch, Tile } from '../../../components/maps/tools/TileSwitch';

const defaultViewport = {
    center: [1, 20],
    zoom: 3.25,
};

type Props = {
    assignments: AssignmentsApi;
};

export const AssignmentsMap: FunctionComponent<Props> = ({ assignments }) => {
    const map = useRef();
    const [currentTile, setCurrentTile] = useState<Tile>(tiles.osm);
    return (
        <Box position="relative">
            <TilesSwitch
                currentTile={currentTile}
                setCurrentTile={setCurrentTile}
            />
            <Map
                zoomSnap={0.25}
                maxZoom={currentTile.maxZoom}
                ref={map}
                style={{ height: '72vh' }}
                center={defaultViewport.center}
                zoom={defaultViewport.zoom}
                scrollWheelZoom={false}
                zoomControl={false}
            >
                <TileLayer
                    attribution={
                        currentTile.attribution ? currentTile.attribution : ''
                    }
                    url={currentTile.url}
                />
                <ZoomControl fitToBounds={() => console.log('fit to bounds')} />
            </Map>
        </Box>
    );
};
