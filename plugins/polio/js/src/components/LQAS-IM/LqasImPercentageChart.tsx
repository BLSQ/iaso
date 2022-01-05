import React, { FunctionComponent, useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { RoundString } from '../../constants/types';
import MESSAGES from '../../constants/messages';
import { PercentageChartWithTitle } from './PercentageChartWithTitle';
import { useGetRegions } from '../../hooks/useGetRegions';
import { useGetGeoJson } from '../../hooks/useGetGeoJson';
import { useConvertedLqasImData } from '../../pages/IM/requests';
import { formatImDataForChart, imTooltipFormatter } from '../../pages/IM/utils';
import {
    formatLqasDataForChart,
    lqasChartTooltipFormatter,
} from '../../pages/LQAS/utils';

type Props = {
    type: 'imGlobal' | 'imIHH' | 'imOHH' | 'lqas';
    round: RoundString;
    campaign: string;
    countryId: number;
};

export const LqasImPercentageChart: FunctionComponent<Props> = ({
    type,
    round,
    campaign,
    countryId,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data, isLoading } = useConvertedLqasImData(type);
    const { data: regions = [] } = useGetRegions(countryId);
    const { data: shapes = [] } = useGetGeoJson(countryId, 'DISTRICT');
    const title: string =
        round === 'round_1'
            ? formatMessage(MESSAGES.round_1)
            : formatMessage(MESSAGES.round_2);
    const chartData = useMemo(() => {
        if (type === 'lqas') {
            return formatLqasDataForChart({
                data,
                campaign,
                round,
                shapes,
                regions,
            });
        }
        return formatImDataForChart({
            data,
            campaign,
            round,
            shapes,
            regions,
        });
    }, [data, campaign, shapes, regions, round, type]);
    const tooltipFormatter =
        type === 'lqas' ? lqasChartTooltipFormatter : imTooltipFormatter;
    return (
        <PercentageChartWithTitle
            title={title}
            data={chartData}
            tooltipFormatter={tooltipFormatter(formatMessage)}
            chartKey={`LQASIMChart-${round}-${campaign}-${type}`}
            isLoading={isLoading}
            showChart={Boolean(campaign)}
        />
    );
};
