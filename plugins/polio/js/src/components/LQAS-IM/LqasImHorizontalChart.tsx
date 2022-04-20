import React, { FunctionComponent, useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { isEqual } from 'lodash';
import { Box } from '@material-ui/core';

import { ConvertedLqasImData, RoundString } from '../../constants/types';
import { PercentageChartWithTitle } from './PercentageChartWithTitle';
import { useGetRegions } from '../../hooks/useGetRegions';
import { formatImDataForChart, imTooltipFormatter } from '../../pages/IM/utils';
import {
    formatLqasDataForChart,
    lqasChartTooltipFormatter,
} from '../../pages/LQAS/utils';
import {
    imBarColorTresholds,
    lqasBarColorTresholds,
} from '../../pages/IM/constants';
import { NoData } from './NoData';

type Props = {
    type: 'imGlobal' | 'imIHH' | 'imOHH' | 'lqas';
    round: RoundString;
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
