import React, { FunctionComponent, useRef, useEffect, RefObject } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import { SxProps, Theme } from '@mui/material';
import { Tile, TilesSwitchControl } from './TilesSwitchControl';

type Props = {
    currentTile: Tile;
    // eslint-disable-next-line no-unused-vars
    setCurrentTile: (newTile: Tile) => void;
    styles?: SxProps<Theme>;
};

export const CustomTileLayer: FunctionComponent<Props> = ({
    currentTile,
    setCurrentTile,
    styles,
}) => {
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
        <>
            <TileLayer
                ref={ref}
                url={currentTile.url}
                // @ts-ignore TODO: fix this type problem
                attribution={currentTile.attribution || ''}
            />
            <TilesSwitchControl
                currentTile={currentTile}
                setCurrentTile={setCurrentTile}
                styles={styles}
            />
        </>
    );
};
