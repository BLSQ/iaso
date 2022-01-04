import React, { useCallback, useEffect, useState } from 'react';
import { object, oneOf, array, string } from 'prop-types';
import { Box } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { MapComponent } from '../../components/MapComponent/MapComponent';
import { MapLegend } from '../../components/MapComponent/MapLegend';
import { MapLegendContainer } from '../../components/MapComponent/MapLegendContainer';
import { LqasImMapHeader } from '../../components/LQAS-IM/LqasImMapHeader.tsx';

import { LqasImPopup } from '../../components/LQAS-IM/LqasImPopUp';
import { determineStatusForDistrict, getLqasStatsForRound } from './utils.ts';
import {
    getScopeStyle,
    findDataForShape,
    makeLegendItem,
} from '../../utils/index';
import { districtColors } from './constants';
import MESSAGES from '../../constants/messages';
import { OK_COLOR, WARNING_COLOR, FAIL_COLOR } from '../../styles/constants';

// Don't put it in utils to avoid circular dep
const makePopup =
    (LQASData, round, campaign = '') =>
    shape => {
        return (
            <LqasImPopup
                shape={shape}
                data={LQASData}
                round={round}
                campaign={campaign}
            />
        );
    };

export const LqasMap = ({ lqasData, shapes, round, campaign, scope }) => {
    const { formatMessage } = useSafeIntl();
    const [renderCount, setRenderCount] = useState(0);
    const [passed, failed, disqualified] = getLqasStatsForRound(
        lqasData,
        campaign,
        round,
    );
    const passedLegendItem = makeLegendItem({
        color: OK_COLOR,
        value: passed?.length,
        message: formatMessage(MESSAGES.passing),
    });
    const failedLegendItem = makeLegendItem({
        color: FAIL_COLOR,
        value: failed?.length,
        message: formatMessage(MESSAGES.failing),
    });
    const disqualifiedLegendItem = makeLegendItem({
        color: WARNING_COLOR,
        value: disqualified?.length,
        message: formatMessage(MESSAGES.disqualified),
    });
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
                        legendItems={[
                            passedLegendItem,
                            disqualifiedLegendItem,
                            failedLegendItem,
                        ]}
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
