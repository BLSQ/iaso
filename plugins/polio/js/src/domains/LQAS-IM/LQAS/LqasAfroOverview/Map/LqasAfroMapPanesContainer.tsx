/* eslint-disable react/no-unstable-nested-components */
import React, {
    FunctionComponent,
    useEffect,
    useCallback,
    useContext,
} from 'react';
import { LoadingSpinner, useRedirectToReplace } from 'bluesquare-components';
import { useMapEvents } from 'react-leaflet';
import { defaultShapeStyle } from '../../../../../utils';
import { MapPanes } from '../../../../Campaigns/MapComponent/MapPanes';
import { COUNTRY, DISTRICT } from '../../../shared/constants';
import { lqasDistrictColors } from '../../constants';
import { LqasAfroOverviewContext } from '../Context/LqasAfroOverviewContext';
import {
    useAfroMapShapes,
    useGetZoomedInBackgroundShapes,
    useGetZoomedInShapes,
} from '../hooks/useAfroMapShapes';
import { AfroMapParams } from '../types';
import { getRound } from '../utils';
import { LqasAfroPopup } from './LqasAfroPopUp';
import { LqasAfroTooltip } from './LqasAfroTooltip';
import { Side } from '../../../../../constants/types';
import { baseUrls } from '../../../../../constants/urls';

const getMainLayerStyle = shape => {
    return lqasDistrictColors[shape.status] ?? defaultShapeStyle;
};
const getBackgroundLayerStyle = () => {
    return {
        color: '#5e5e5e',
        opacity: '1',
        fillColor: 'lightGrey',
        weight: '4',
        zIndex: 1,
    };
};

type Props = {
    params: AfroMapParams & { accountId: string };
    side: Side;
    currentUrl: string;
};

export const LqasAfroMapPanesContainer: FunctionComponent<Props> = ({
    params,
    side,
    currentUrl,
}) => {
    const isEmbedded = currentUrl === baseUrls.embeddedLqasAfroPath;
    const redirectToReplace = useRedirectToReplace();
    const handleEvent = useCallback(
        currentMap => {
            const newParams: Record<string, string> = {
                ...params,
            };
            if (side === 'left') {
                newParams.zoomLeft = currentMap.getZoom();
            }
            if (side === 'right') {
                newParams.zoomRight = currentMap.getZoom();
            }
            const latLongCenter = currentMap.getCenter();
            const paramCenter = JSON.stringify([
                latLongCenter.lat,
                latLongCenter.lng,
            ]);
            if (side === 'left') {
                newParams.centerLeft = paramCenter;
            }
            if (side === 'right') {
                newParams.centerRight = paramCenter;
            }
            redirectToReplace(currentUrl, newParams);
        },
        [params, redirectToReplace, side, currentUrl],
    );
    const map = useMapEvents({
        zoomend: () => {
            setBounds(map.getBounds());
            handleEvent(map);
        },
        dragend: () => {
            setBounds(map.getBounds());
            handleEvent(map);
        },
    });

    const { bounds, setBounds } = useContext(LqasAfroOverviewContext);
    const selectedRound = getRound(params.rounds, side);

    const showCountries =
        side === 'left'
            ? params.displayedShapesLeft !== 'district'
            : params.displayedShapesRight !== 'district';
    const { data: mapShapes, isFetching: isAfroShapesLoading } =
        useAfroMapShapes({
            category: 'lqas',
            enabled: showCountries,
            params,
            selectedRound,
            side,
            isEmbedded,
        });

    const { data: zoominShapes, isFetching: isLoadingZoomin } =
        useGetZoomedInShapes({
            bounds: JSON.stringify(bounds),
            category: 'lqas',
            enabled: !showCountries && Boolean(bounds),
            params,
            selectedRound,
            side,
            isEmbedded,
        });

    const {
        data: zoominbackgroundShapes,
        isFetching: isLoadingZoominbackground,
    } = useGetZoomedInBackgroundShapes({
        bounds: JSON.stringify(bounds),
        enabled: !showCountries && Boolean(bounds),
        isEmbedded,
    });
    const paramsAsString = JSON.stringify(params);
    const isLoading =
        isAfroShapesLoading ||
        (isLoadingZoomin && !showCountries) ||
        (isLoadingZoominbackground && !showCountries);

    useEffect(() => {
        if (map) {
            if (isLoading && map.dragging._enabled) {
                map.dragging.disable();
            }
            if (!isLoading && !map.dragging._enabled) {
                map.dragging.enable();
            }
        }
    }, [isLoading, map]);
    return (
        <>
            {isLoading && <LoadingSpinner fixed={false} absolute />}

            {showCountries && (
                <MapPanes
                    mainLayer={mapShapes}
                    getMainLayerStyle={getMainLayerStyle}
                    name={`LQAS-Map-country-view-${paramsAsString}`}
                    // @ts-ignore
                    makePopup={shape => {
                        return <LqasAfroPopup shape={shape} view={COUNTRY} />;
                    }}
                    customTooltip={shape => (
                        <LqasAfroTooltip
                            shape={shape}
                            name={shape.data?.country_name}
                        />
                    )}
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
                    makePopup={shape => {
                        return <LqasAfroPopup shape={shape} view={DISTRICT} />;
                    }}
                    customTooltip={shape => (
                        <LqasAfroTooltip
                            shape={shape}
                            name={shape.data?.district_name}
                        />
                    )}
                />
            )}
        </>
    );
};
