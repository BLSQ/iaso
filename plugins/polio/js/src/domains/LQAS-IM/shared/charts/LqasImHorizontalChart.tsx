import React, { FunctionComponent, useMemo } from 'react';
import { Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { isEqual } from 'lodash';
import { UseQueryResult } from 'react-query';
import { imBarColorTresholds } from '../../IM/constants';
import { formatImDataForChart, imTooltipFormatter } from '../../IM/utils';
import { lqasBarColorTresholds } from '../../LQAS/constants';
import {
    formatLqasDataForChart,
    lqasChartTooltipFormatter,
} from '../../LQAS/utils';
import { ConvertedLqasImData } from '../../types';
import { useGetRegions } from '../hooks/api/useGetRegions';
import { NoData } from './NoData';
import { GraphTooltipFormatter } from './PercentageBarChart/types';
import { PercentageChartWithTitle } from './PercentageChartWithTitle';

type Props = {
    type: 'imGlobal' | 'imIHH' | 'imOHH' | 'lqas';
    round: number | undefined | string;
    campaign: string;
    countryId?: number;
    data: Record<string, ConvertedLqasImData>;
    isLoading: boolean;
    isEmbedded?: boolean;
};

export const LqasImHorizontalChart: FunctionComponent<Props> = ({
    type,
    round: roundProps,
    campaign,
    countryId,
    data,
    isLoading,
    isEmbedded = false,
}) => {
    // TODO: add consition on scope
    const { formatMessage } = useSafeIntl();
    const round =
        typeof roundProps === 'string' ? parseInt(roundProps, 10) : roundProps;
    const {
        data: regions,
        isLoading: isLoadingRegions,
    }: UseQueryResult<{ name: string; id: number }[]> = useGetRegions(
        countryId,
        isEmbedded,
    );

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

    const tooltipFormatter: GraphTooltipFormatter = useMemo(() => {
        const baseFormatter =
            type === 'lqas' ? lqasChartTooltipFormatter : imTooltipFormatter;
        return baseFormatter(formatMessage);
    }, [formatMessage, type]);

    const colorTresholds =
        type === 'lqas' ? lqasBarColorTresholds : imBarColorTresholds;

    const hasData =
        data && campaign && data[campaign] && round
            ? !isEqual(data[campaign][round], [])
            : false;
    return (
        <>
            {campaign && !hasData && <NoData />}
            {hasData && (
                <Box p={2}>
                    <PercentageChartWithTitle
                        data={chartData}
                        tooltipFormatter={tooltipFormatter}
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
