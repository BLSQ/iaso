import React from 'react';
import { object, oneOf, func, array } from 'prop-types';
import { MapComponent } from '../../components/MapComponent/MapComponent';
import { LqasMapHeader } from './LqasMapHeader';
import { LqasPopup } from './LqasPopup';
import { getLqasStatsForRound } from './utils';

// Don't put it in utils to avoid circular dep
const makePopup = (LQASData, round) => shape => {
    return <LqasPopup shape={shape} LQASData={LQASData} round={round} />;
};

export const LqasMap = ({ lqasData, shapes, round, getShapeStyles }) => {
    const [evaluated, passed, failed, disqualified] = getLqasStatsForRound(
        lqasData,
        round,
    );
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
                name="LQASMapRound1"
                mainLayer={shapes}
                onSelectShape={() => null}
                getMainLayerStyle={getShapeStyles}
                tooltipLabels={{
                    main: 'District',
                    background: 'Region',
                }}
                makePopup={makePopup(lqasData, round)}
                height={600}
            />
        </>
    );
};

LqasMap.propTypes = {
    round: oneOf(['round_1', 'round_2']).isRequired,
    lqasData: object,
    shapes: array,
    getShapeStyles: func,
};
LqasMap.defaultProps = {
    lqasData: {},
    shapes: {},
    getShapeStyles: () => null,
};
