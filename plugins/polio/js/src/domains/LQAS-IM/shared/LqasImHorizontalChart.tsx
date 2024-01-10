import React, { FunctionComponent, useMemo } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { isEqual } from 'lodash';
import { Box } from '@mui/material';

import { ConvertedLqasImData } from '../../../constants/types';
import { PercentageChartWithTitle } from './PercentageChartWithTitle';
import { useGetRegions } from './hooks/api/useGetRegions';
import { formatImDataForChart, imTooltipFormatter } from '../IM/utils';
import {
    formatLqasDataForChart,
    lqasChartTooltipFormatter,
} from '../LQAS/utils';
import { imBarColorTresholds } from './constants';
import { NoData } from './NoData';
import { lqasBarColorTresholds } from '../LQAS/constants';

type Props = {
    type: 'imGlobal' | 'imIHH' | 'imOHH' | 'lqas';
    round: number;
    campaign: string;
    countryId: number;
    data: Record<string, ConvertedLqasImData>;
    isLoading: boolean;
};

export const LqasImHorizontalChart: FunctionComponent<Props> = ({
    type,
    round,
    campaign,
    countryId,
    data,
    isLoading,
}) => {
    // TODO: add consition on scope
    const { formatMessage } = useSafeIntl();
    const { data: regions = [], isLoading: isLoadingRegions } =
        useGetRegions(countryId);
    const chartData = useMemo(() => {
        if (type === 'lqas') {
            return formatLqasDataForChart({
                data,
                campaign,
                round,
                regions,
            });
        }
        return formatImDataForChart({
            data,
            campaign,
            round,
            regions,
        });
    }, [data, campaign, regions, round, type]);
    const tooltipFormatter =
        type === 'lqas' ? lqasChartTooltipFormatter : imTooltipFormatter;
    const colorTresholds =
        type === 'lqas' ? lqasBarColorTresholds : imBarColorTresholds;
    const hasData =
        data && campaign && data[campaign]
            ? !isEqual(data[campaign][round], [])
            : false;
    return (
        <>
            {campaign && !hasData && <NoData />}
            {hasData && (
                <Box p={2}>
                    <PercentageChartWithTitle
                        data={chartData}
                        tooltipFormatter={tooltipFormatter(formatMessage)}
                        chartKey={`LQASIMChart-${round}-${campaign}-${type}`}
                        isLoading={isLoading || isLoadingRegions}
                        showChart={Boolean(campaign)}
                        colorTresholds={colorTresholds}
                    />
                </Box>
            )}
        </>
    );
};
