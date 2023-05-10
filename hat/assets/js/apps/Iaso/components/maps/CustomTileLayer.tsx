import React, { FunctionComponent, useRef, useEffect } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import { Tile } from './tools/TilesSwitchDialog';

type Props = {
    currentTile: Tile;
};

export const CustomTileLayer: FunctionComponent<Props> = ({ currentTile }) => {
    const ref: any = useRef(null);
    const map: any = useMap();
    useEffect(() => {
        map.setMaxZoom(currentTile.maxZoom);
        if (currentTile.maxZoom < map._zoom) {
            map.setZoom(currentTile.maxZoom);
        }
        if (ref.current) {
            ref.current.setUrl(currentTile.url);
        }
    }, [currentTile, map]);
    return (
        <TileLayer
            ref={ref}
            url={currentTile.url}
            // @ts-ignore TODO: fix this type problem
            attribution={currentTile.attribution || ''}
        />
    );
};
