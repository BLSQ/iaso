import React, { FunctionComponent, useMemo, useState } from 'react';
import { useMapEvents } from 'react-leaflet';
import { LoadingSpinner } from 'bluesquare-components';
import { IN_SCOPE, lqasDistrictColors } from '../../IM/constants';
import { MapPanes } from '../../../components/MapComponent/MapPanes';
import { useAfroMapShapes, useGetZoomedInShapes } from './useAfroMapShapes';

const getMainLayerStyle = shape => {
    return lqasDistrictColors[shape.status] ?? lqasDistrictColors[IN_SCOPE];
};

export const LqasAfroMapPanesContainer: FunctionComponent = () => {
    const map = useMapEvents({
        zoomend: () => {
            setZoom(map.getZoom());
            setBounds(map.getBounds());
        },
        dragend: () => setBounds(map.getBounds()),
    });
    const [zoom, setZoom] = useState<number>(map.getZoom());
    const [bounds, setBounds] = useState<number>(map.getBounds());
    const boundsString = JSON.stringify(bounds);

    const { data: mapShapes, isFetching: isAfroShapesLoading } =
        useAfroMapShapes('lqas');

    const { data: zoominShapes, isFetching: isLoadingZoomin } =
        useGetZoomedInShapes(boundsString, 'lqas');

    const showCountries = zoom <= 5;

    const mainLayer = useMemo(() => {
        if (showCountries) return mapShapes;
        return zoominShapes;
    }, [mapShapes, showCountries, zoominShapes]);
    return (
        <>
            {' '}
            {(isAfroShapesLoading || (isLoadingZoomin && !showCountries)) && (
                <LoadingSpinner fixed={false} absolute />
            )}
            <MapPanes
                mainLayer={mainLayer}
                // backgroundLayer={}
                getMainLayerStyle={getMainLayerStyle}
                // getBackgroundLayerStyle={}
                name="LQAS-Map-country-view"
            />
        </>
    );
};
