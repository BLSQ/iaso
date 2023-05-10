import React, { FunctionComponent, useRef, useEffect } from 'react';
import { TileLayer } from 'react-leaflet';
import { Tile } from './tools/TilesSwitchDialog';

type Props = {
    currentTile: Tile;
};

export const CustomTileLayer: FunctionComponent<Props> = ({ currentTile }) => {
    const ref: any = useRef(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.setUrl(currentTile.url);
        }
    }, [currentTile]);
    return (
        <TileLayer
            ref={ref}
            url={currentTile.url}
            // @ts-ignore TODO: fix this type problem
            attribution={currentTile.attribution || ''}
        />
    );
};
