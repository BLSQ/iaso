/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../../../constants/messages';
import { floatToPercentString } from '../../../utils';

type CareGiverStats = {
    ratio: number;
};
type District = {
    care_giver_stats: CareGiverStats;
};
type Props = {
    district: District;
};
export const CaregiverInfoSource: FunctionComponent<Props> = ({ district }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            {Object.keys(district.care_giver_stats)
                .filter(
                    sourceKey =>
                        sourceKey !== 'caregivers_informed' &&
                        sourceKey !== 'ratio' &&
                        sourceKey !== 'caregivers_informed_ratio',
                )
                .map(sourceKey => {
                    return (
                        <p key={sourceKey}>
                            {`${formatMessage(MESSAGES[sourceKey]) ?? sourceKey}
                        : ${floatToPercentString(
                            district.care_giver_stats.ratio,
                        )}
                        `}
                        </p>
                    );
                })}
        </>
    );
};
