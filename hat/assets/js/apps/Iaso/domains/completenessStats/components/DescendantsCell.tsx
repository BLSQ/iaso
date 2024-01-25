import React, { ReactElement, FunctionComponent } from 'react';
import { FormStatRow } from '../types';
import MESSAGES from '../messages';
import { useSafeIntl } from 'bluesquare-components';
import { LinearProgressWithLabel } from './LinearProgressWithLabel';
import { useEffectiveThreshold } from '../hooks/useEffectiveThreshold';
import { useGetLegend } from '../../../components/LegendBuilder/Legend';


export const DescendantsCell = ({value}: FormStatRow): ReactElement =>  {
    const { formatMessage } = useSafeIntl();
    const effectiveThreshold = useEffectiveThreshold(value.legend_threshold);
    const getLegend = useGetLegend(effectiveThreshold);
    const color = getLegend(value.percent);
    return value.descendants > 0 ? (
        <LinearProgressWithLabel
            value={value.percent}
            color={color}
            extraLabel={`${value.descendants_ok} / ${value.descendants}`}
        />
    ) : (
        <div
            title={formatMessage(
                MESSAGES.descendantsNoSubmissionExpected,
            )}
            style={{
                textDecoration:
                    'underline dotted',
            }}
        >
            N/A
        </div>
    );
};
