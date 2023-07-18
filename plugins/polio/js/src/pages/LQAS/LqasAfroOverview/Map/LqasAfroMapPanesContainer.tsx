import React, { FunctionComponent, useState } from 'react';
import { useMapEvents } from 'react-leaflet';
import { LoadingSpinner } from 'bluesquare-components';
import { lqasDistrictColors } from '../../../IM/constants';
import { MapPanes } from '../../../../components/MapComponent/MapPanes';
import {
    useAfroMapShapes,
    useGetZoomedInBackgroundShapes,
    useGetZoomedInShapes,
} from '../hooks/useAfroMapShapes';
import { defaultShapeStyle } from '../../../../utils';
import { AfroMapParams, RoundSelection, Side } from '../types';

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
    side: Side;
};

const getRound = (rounds: string | undefined, side: Side): RoundSelection => {
    if (!rounds) {
        if (side === 'left') return 'penultimate';
        return 'latest';
    }
    const [leftRound, rightRound] = rounds.split(',');
    if (side === 'left') {
        const parsedValue = parseInt(leftRound, 10);
        if (Number.isInteger(parsedValue)) {
            return parsedValue;
        }
        return leftRound as RoundSelection;
    }
    const parsedValue = parseInt(rightRound, 10);
    if (Number.isInteger(parsedValue)) {
        return parsedValue;
    }
    return rightRound as RoundSelection;
};

export const LqasAfroMapPanesContainer: FunctionComponent<Props> = ({
    params,
    side,
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
    const selectedRound = getRound(params.rounds, side);

    const showCountries = map.getZoom() <= 5;
    const { data: mapShapes, isFetching: isAfroShapesLoading } =
        useAfroMapShapes({
            category: 'lqas',
            enabled: showCountries,
            params,
            selectedRound,
        });

    const { data: zoominShapes, isFetching: isLoadingZoomin } =
        useGetZoomedInShapes({
            bounds: JSON.stringify(bounds),
            category: 'lqas',
            enabled: !showCountries,
            params,
            selectedRound,
        });

    const {
        data: zoominbackgroundShapes,
        isFetching: isLoadingZoominbackground,
    } = useGetZoomedInBackgroundShapes({
        bounds: JSON.stringify(bounds),
        enabled: !showCountries,
    });
    const paramsAsString = JSON.stringify(params);
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
                    getMainLayerStyle={getMainLayerStyle}
                    name={`LQAS-Map-country-view-${paramsAsString}`}
                    tooltipFieldKey="data.country_name"
                />
            )}
            {!showCountries && (
                <MapPanes
                    key={`${JSON.stringify(bounds)}`}
                    mainLayer={zoominShapes}
                    backgroundLayer={zoominbackgroundShapes}
                    getMainLayerStyle={getMainLayerStyle}
                    getBackgroundLayerStyle={getBackgroundLayerStyle}
                    name={`LQAS-Map-zooomin-view-${paramsAsString}`}
                    tooltipFieldKey="data.district_name"
                />
            )}
        </>
    );
};
