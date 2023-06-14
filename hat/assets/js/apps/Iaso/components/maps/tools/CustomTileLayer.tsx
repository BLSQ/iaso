import React, { FunctionComponent, useRef, useEffect, RefObject } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import { Tile } from './TilesSwitchDialog';

type Props = {
    currentTile: Tile;
};

export const CustomTileLayer: FunctionComponent<Props> = ({ currentTile }) => {
    const ref: RefObject<any> = useRef(null);
    const map: any = useMap();
    useEffect(() => {
        if (ref.current && ref.current.url !== currentTile.url) {
            map.setMaxZoom(currentTile.maxZoom);
            if (currentTile.maxZoom < map.getZoom()) {
                map.setZoom(currentTile.maxZoom);
            }
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
