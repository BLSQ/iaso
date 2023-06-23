import React, { FunctionComponent, useState } from 'react';
import { useMapEvents } from 'react-leaflet';
import { LoadingSpinner } from 'bluesquare-components';
import { lqasDistrictColors } from '../../IM/constants';
import { MapPanes } from '../../../components/MapComponent/MapPanes';
import {
    useAfroMapShapes,
    useGetZoomedInBackgroundShapes,
    useGetZoomedInShapes,
} from './useAfroMapShapes';
import { defaultShapeStyle } from '../../../utils';
import { AfroMapParams } from './types';

const getMainLayerStyle = shape => {
    return lqasDistrictColors[shape.status] ?? defaultShapeStyle;
};
const getBackgroundLayerStyle = () => {
    return {
        color: '#5e5e5e',
        opacity: '1',
        fillColor: 'lightGrey',
        weight: '2',
        zIndex: 1,
    };
};

type Props = {
    params: AfroMapParams;
};

export const LqasAfroMapPanesContainer: FunctionComponent<Props> = ({
    params,
}) => {
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
        useAfroMapShapes({ category: 'lqas', enabled: showCountries, params });

    const { data: zoominShapes, isFetching: isLoadingZoomin } =
        useGetZoomedInShapes({
            bounds: JSON.stringify(bounds),
            category: 'lqas',
            enabled: !showCountries,
            params,
        });

    const {
        data: zoominbackgroundShapes,
        isFetching: isLoadingZoominbackground,
    } = useGetZoomedInBackgroundShapes({
        bounds: JSON.stringify(bounds),
        enabled: !showCountries,
    });

    return (
        <>
            {(isAfroShapesLoading ||
                (isLoadingZoomin && !showCountries) ||
                (isLoadingZoominbackground && !showCountries)) && (
                <LoadingSpinner fixed={false} absolute />
            )}

            {showCountries && (
                <MapPanes
                    mainLayer={mapShapes}
                    // backgroundLayer={zoominbackgroundShapes}
                    getMainLayerStyle={getMainLayerStyle}
                    // getBackgroundLayerStyle={}
                    name={`LQAS-Map-country-view-${JSON.stringify(params)}`}
                />
            )}
            {!showCountries && (
                <MapPanes
                    key={JSON.stringify(bounds)}
                    mainLayer={zoominShapes}
                    backgroundLayer={zoominbackgroundShapes}
                    getMainLayerStyle={getMainLayerStyle}
                    getBackgroundLayerStyle={getBackgroundLayerStyle}
                    name="LQAS-Map-zoomin-view-"
                />
            )}
        </>
    );
};
