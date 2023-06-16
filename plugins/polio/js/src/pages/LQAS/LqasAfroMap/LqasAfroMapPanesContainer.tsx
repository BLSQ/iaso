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
            setBounds(map.getBounds());
        },
        dragend: () => {
            setBounds(map.getBounds());
        },
    });
    const [bounds, setBounds] = useState<number>(map.getBounds());

    const showCountries = map.getZoom() <= 5;
    const { data: mapShapes, isFetching: isAfroShapesLoading } =
        useAfroMapShapes('lqas', showCountries);

    const { data: zoominShapes, isFetching: isLoadingZoomin } =
        useGetZoomedInShapes(JSON.stringify(bounds), 'lqas', !showCountries);

    return (
        <>
            {' '}
            {(isAfroShapesLoading || (isLoadingZoomin && !showCountries)) && (
                <LoadingSpinner fixed={false} absolute />
            )}
            {showCountries && (
                <MapPanes
                    mainLayer={mapShapes}
                    // backgroundLayer={}
                    getMainLayerStyle={getMainLayerStyle}
                    // getBackgroundLayerStyle={}
                    name="LQAS-Map-country-view"
                />
            )}
            {!showCountries && (
                <MapPanes
                    key={JSON.stringify(bounds)}
                    mainLayer={zoominShapes}
                    // backgroundLayer={}
                    getMainLayerStyle={getMainLayerStyle}
                    // getBackgroundLayerStyle={}
                    name="LQAS-Map-zoomin-view-"
                />
            )}
        </>
    );
};
