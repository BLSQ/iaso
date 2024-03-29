import React, { FunctionComponent, useMemo } from 'react';
import { useTheme } from '@mui/material';
import { scaleThreshold } from '@visx/scale';
import { LegendThreshold, LegendItem, LegendLabel } from '@visx/legend';
import { ScaleThreshold } from './types';
import { getThresHoldLabels } from './utils';

export const useGetLegend = (threshold?: ScaleThreshold): any => {
    return scaleThreshold(threshold);
};

type Props = {
    threshold: ScaleThreshold;
};

export const Legend: FunctionComponent<Props> = ({ threshold }) => {
    const theme = useTheme();
    const getLegend = useGetLegend(threshold);
    const legendLabels = useMemo(
        () => getThresHoldLabels(threshold),
        [threshold],
    );
    return (
        <LegendThreshold scale={getLegend}>
            {labels =>
                labels.reverse().map(label => {
                    return (
                        <LegendItem
                            key={`legend-${label.value}-${label.index}`}
                            margin={theme.spacing(0, 0, 1, 0)}
                        >
                            <svg width={20} height={20}>
                                <circle
                                    fill={label.value}
                                    cx="10"
                                    cy="10"
                                    r="10"
                                />
                            </svg>
                            <LegendLabel
                                align="left"
                                margin={theme.spacing(0, 0, 0, 1)}
                            >
                                {legendLabels[label.index]}
                            </LegendLabel>
                        </LegendItem>
                    );
                })
            }
        </LegendThreshold>
    );
};
