import React, { FunctionComponent, useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { isEqual } from 'lodash';
import { RoundString } from '../../constants/types';
import { PercentageChartWithTitle } from './PercentageChartWithTitle';
import { useGetRegions } from '../../hooks/useGetRegions';
import { useConvertedLqasImData } from '../../pages/IM/requests';
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
};

export const LqasImPercentageChart: FunctionComponent<Props> = ({
    type,
    round,
    campaign,
    countryId,
}) => {
    // TODO: add consition on scope
    const { formatMessage } = useSafeIntl();
    const { data, isLoading } = useConvertedLqasImData(type, countryId);
    const { data: regions = [] } = useGetRegions(countryId);
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
                <PercentageChartWithTitle
                    data={chartData}
                    tooltipFormatter={tooltipFormatter(formatMessage)}
                    chartKey={`LQASIMChart-${round}-${campaign}-${type}`}
                    isLoading={isLoading}
                    showChart={Boolean(campaign)}
                    colorTresholds={colorTresholds}
                />
            )}
        </>
    );
};
