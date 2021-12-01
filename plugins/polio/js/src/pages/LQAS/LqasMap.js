import React, { useCallback, useEffect, useState } from 'react';
import { object, oneOf, array, string } from 'prop-types';
import { Box } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { MapComponent } from '../../components/MapComponent/MapComponent';
import { MapLegend } from '../../components/MapComponent/MapLegend';
import { MapLegendContainer } from '../../components/MapComponent/MapLegendContainer';
import { LqasMapHeader } from './LqasMapHeader';
import { LqasPopup } from './LqasPopup';
import {
    findLQASDataForShape,
    determineStatusForDistrict,
    getScopeStyle,
    getLqasStatsForRound,
} from './utils';
import { districtColors } from './constants';
import MESSAGES from '../../constants/messages';

// Don't put it in utils to avoid circular dep
const makePopup =
    (LQASData, round, campaign = '') =>
    shape => {
        return (
            <LqasPopup
                shape={shape}
                LQASData={LQASData}
                round={round}
                campaign={campaign}
            />
        );
    };

const makeLegendItem = ({ message, value, color }) => {
    return {
        label: `${message}: ${value}`,
        value: `${message}: ${value}`,
        color,
    };
};

export const LqasMap = ({ lqasData, shapes, round, campaign, scope }) => {
    const { formatMessage } = useSafeIntl();
    const [renderCount, setRenderCount] = useState(0);
    const [evaluated, passed, failed, disqualified] = getLqasStatsForRound(
        lqasData,
        campaign,
        round,
    );
    const passedLegendItem = makeLegendItem({
        color: 'green',
        value: passed?.length,
        message: formatMessage(MESSAGES.passing),
    });
    const failedLegendItem = makeLegendItem({
        color: 'red',
        value: failed?.length,
        message: formatMessage(MESSAGES.failing),
    });
    const disqualifiedLegendItem = makeLegendItem({
        color: 'orange',
        value: disqualified?.length,
        message: formatMessage(MESSAGES.disqualified),
    });
    // const notCheckedLegendItem = makeLegendItem({
    //     color: 'grey',
    //     value: scope.length - evaluated.length,
    //     message: formatMessage(MESSAGES.failing),
    // });
    const getShapeStyles = useCallback(
        shape => {
            const status = determineStatusForDistrict(
                findLQASDataForShape({
                    shape,
                    LQASData: lqasData,
                    round,
                    campaign,
                }),
            );
            if (status) return districtColors[status];
            return getScopeStyle(shape, scope);
        },
        [scope, campaign, round, lqasData],
    );

    useEffect(() => {
        setRenderCount(count => count + 1);
    }, [campaign]);

    return (
        <>
            <LqasMapHeader
                round={round}
                evaluated={evaluated.length}
                passed={passed.length}
                disqualified={disqualified.length}
                failed={failed.length}
            />
            <Box position="relative">
                <MapLegendContainer>
                    <MapLegend
                        title={formatMessage(MESSAGES.district)}
                        legendItems={[
                            passedLegendItem,
                            disqualifiedLegendItem,
                            failedLegendItem,
                            // notCheckedLegendItem,
                        ]}
                        width="md"
                    />
                </MapLegendContainer>
                <MapComponent
                    key={`LQASMapRound1${renderCount}`}
                    name="LQASMapRound1"
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
