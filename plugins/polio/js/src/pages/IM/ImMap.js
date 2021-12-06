import React, { useCallback, useEffect, useState } from 'react';
import { object, oneOf, array, string } from 'prop-types';
import { Box } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { MapComponent } from '../../components/MapComponent/MapComponent';
import { MapLegend } from '../../components/MapComponent/MapLegend';
import { MapLegendContainer } from '../../components/MapComponent/MapLegendContainer';
import { ImMapHeader } from './ImMapHeader';
import { LqasImPopup } from '../../components/LQAS-IM/LqasImPopUp';
import { determineStatusForDistrict, getImStatsForRound } from './utils';
import { districtColors } from './constants';
import {
    getScopeStyle,
    findDataForShape,
    makeLegendItem,
} from '../../utils/LqasIm';
import MESSAGES from '../../constants/messages';

// Don't put it in utils to avoid circular dep
const makePopup =
    (imData, round, campaign = '') =>
    shape => {
        return (
            <LqasImPopup
                shape={shape}
                data={imData}
                round={round}
                campaign={campaign}
            />
        );
    };

export const ImMap = ({ imData, shapes, round, campaign, scope }) => {
    const { formatMessage } = useSafeIntl();
    const [renderCount, setRenderCount] = useState(0);
    // eslint-disable-next-line no-unused-vars
    const [_evaluated, passed, failed, disqualified] = getImStatsForRound(
        imData,
        campaign,
        round,
    );
    const passedLegendItem = makeLegendItem({
        color: 'green',
        value: passed?.length,
        message: formatMessage(MESSAGES.imOK),
    });
    const failedLegendItem = makeLegendItem({
        color: 'red',
        value: failed?.length,
        message: formatMessage(MESSAGES.imFail),
    });
    const disqualifiedLegendItem = makeLegendItem({
        color: 'orange',
        value: disqualified?.length,
        message: formatMessage(MESSAGES.imWarning),
    });
    // const notCheckedLegendItem = makeLegendItem({
    //     color: 'grey',
    //     value: scope.length - evaluated.length,
    //     message: formatMessage(MESSAGES.failing),
    // });
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

    useEffect(() => {
        setRenderCount(count => count + 1);
    }, [campaign]);

    return (
        <>
            <ImMapHeader round={round} />
            <Box position="relative">
                <MapLegendContainer>
                    <MapLegend
                        title={formatMessage(MESSAGES.imResults)}
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
