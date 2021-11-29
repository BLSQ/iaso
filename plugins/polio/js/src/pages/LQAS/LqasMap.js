import React, { useCallback, useEffect, useState } from 'react';
import { object, oneOf, array, string } from 'prop-types';
import { MapComponent } from '../../components/MapComponent/MapComponent';
import { LqasMapHeader } from './LqasMapHeader';
import { LqasPopup } from './LqasPopup';
import {
    findLQASDataForShape,
    determineStatusForDistrict,
    getScopeStyle,
    getLqasStatsForRound,
} from './utils';
import { districtColors } from './constants';

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

export const LqasMap = ({ lqasData, shapes, round, campaign, scope }) => {
    const [renderCount, setRenderCount] = useState(0);
    const [evaluated, passed, failed, disqualified] = getLqasStatsForRound(
        lqasData,
        campaign,
        round,
    );
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
