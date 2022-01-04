import React, { useCallback, useEffect, useState } from 'react';
import { object, oneOf, array, string } from 'prop-types';
import { Box } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { MapComponent } from '../../components/MapComponent/MapComponent';
import { MapLegend } from '../../components/MapComponent/MapLegend';
import { MapLegendContainer } from '../../components/MapComponent/MapLegendContainer';
import { makePopup } from '../../utils/LqasIm.tsx';
import { LqasImMapHeader } from '../../components/LQAS-IM/LqasImMapHeader.tsx';
import { determineStatusForDistrict, makeImMapLegendItems } from './utils.ts';
import { districtColors } from './constants';
import { getScopeStyle, findDataForShape } from '../../utils/index';
import MESSAGES from '../../constants/messages';

export const ImMap = ({ imData, shapes, round, campaign, scope }) => {
    const { formatMessage } = useSafeIntl();
    const [renderCount, setRenderCount] = useState(0);

    const legendItems = makeImMapLegendItems(formatMessage)(
        imData,
        campaign,
        round,
    );

    const getShapeStyles = useCallback(
        shape => {
            const status = determineStatusForDistrict(
                findDataForShape({
                    shape,
                    data: imData,
                    round,
                    campaign,
                }),
            );
            if (status) return districtColors[status];
            return getScopeStyle(shape, scope);
        },
        [scope, campaign, round, imData],
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
                        title={formatMessage(MESSAGES.imResults)}
                        legendItems={legendItems}
                        width="lg"
                    />
                </MapLegendContainer>
                <MapComponent
                    // Use the key to force render
                    key={`IMMapRound${round}${renderCount}`}
                    name={`IMMapRound${round}`}
                    mainLayer={shapes}
                    onSelectShape={() => null}
                    getMainLayerStyle={getShapeStyles}
                    tooltipLabels={{
                        main: 'District',
                        background: 'Region',
                    }}
                    makePopup={makePopup(imData, round, campaign)}
                    height={600}
                />
            </Box>
        </>
    );
};

ImMap.propTypes = {
    round: oneOf(['round_1', 'round_2']).isRequired,
    imData: object,
    shapes: array,
    campaign: string,
    scope: array,
};
ImMap.defaultProps = {
    imData: {},
    shapes: {},
    campaign: '',
    scope: [],
};
