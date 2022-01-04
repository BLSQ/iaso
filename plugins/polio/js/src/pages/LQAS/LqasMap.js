import React, { useCallback, useEffect, useState } from 'react';
import { object, oneOf, array, string } from 'prop-types';
import { Box } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { MapComponent } from '../../components/MapComponent/MapComponent';
import { MapLegend } from '../../components/MapComponent/MapLegend';
import { MapLegendContainer } from '../../components/MapComponent/MapLegendContainer';
import { LqasImMapHeader } from '../../components/LQAS-IM/LqasImMapHeader.tsx';
import { makePopup } from '../../utils/LqasIm.tsx';
import {
    determineStatusForDistrict,
    makeLqasMapLengendItems,
} from './utils.ts';
import { getScopeStyle, findDataForShape } from '../../utils/index';
import { districtColors } from './constants';
import MESSAGES from '../../constants/messages';

export const LqasMap = ({ lqasData, shapes, round, campaign, scope }) => {
    const { formatMessage } = useSafeIntl();
    const [renderCount, setRenderCount] = useState(0);
    const legendItems = makeLqasMapLengendItems(formatMessage)(
        lqasData,
        campaign,
        round,
    );
    const getShapeStyles = useCallback(
        shape => {
            const status = determineStatusForDistrict(
                findDataForShape({
                    shape,
                    data: lqasData,
                    round,
                    campaign,
                }),
            );
            if (status) return districtColors[status];
            return getScopeStyle(shape, scope);
        },
        [scope, campaign, round, lqasData],
    );

    // force Map render when campaign changes, otherwise, shape colors are off
    useEffect(() => {
        setRenderCount(count => count + 1);
    }, [campaign]);

    return (
        <>
            <LqasImMapHeader round={round} />
            <Box position="relative">
                <MapLegendContainer>
                    <MapLegend
                        title={formatMessage(MESSAGES.lqasResults)}
                        legendItems={legendItems}
                        width="lg"
                    />
                </MapLegendContainer>
                <MapComponent
                    // Use the key to force render
                    key={`LQASMapRound${round}${renderCount}`}
                    name={`LQASMapRound${round}`}
                    mainLayer={shapes}
                    onSelectShape={() => null}
                    getMainLayerStyle={getShapeStyles}
                    tooltipLabels={{
                        main: 'District',
                        background: 'Region',
                    }}
                    makePopup={makePopup(lqasData, round, campaign)}
                    height={600}
                />
            </Box>
        </>
    );
};

LqasMap.propTypes = {
    round: oneOf(['round_1', 'round_2']).isRequired,
    lqasData: object,
    shapes: array,
    campaign: string,
    scope: array,
};
LqasMap.defaultProps = {
    lqasData: {},
    shapes: {},
    campaign: '',
    scope: [],
};
