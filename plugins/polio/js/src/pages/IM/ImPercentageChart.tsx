import React, { FunctionComponent, useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { RoundString } from '../../constants/types';
import MESSAGES from '../../constants/messages';
import { PercentageChartWithTitle } from '../../components/LQAS-IM/PercentageChartWithTitle';
import { useGetRegions } from '../../hooks/useGetRegions';
import { useGetGeoJson } from '../../hooks/useGetGeoJson';
import { useConvertedIMData } from './requests';
import { formatImDataForChart, imTooltipFormatter } from './utils';

type Props = {
    imType: 'imGlobal' | 'imIHH' | 'imOHH';
    round: RoundString;
    campaign: string;
    countryId: number;
};

export const ImPercentageChart: FunctionComponent<Props> = ({
    imType,
    round,
    campaign,
    countryId,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data, isLoading } = useConvertedIMData(imType);
    const { data: regions = [] } = useGetRegions(countryId);
    const { data: shapes = [] } = useGetGeoJson(countryId, 'DISTRICT');
    const title: string =
        round === 'round_1'
            ? formatMessage(MESSAGES.round_1)
            : formatMessage(MESSAGES.round_2);
    const chartData = useMemo(
        () =>
            formatImDataForChart({
                data,
                campaign,
                round,
                shapes,
                regions,
            }),
        [data, campaign, shapes, regions, round],
    );

    return (
        <PercentageChartWithTitle
            title={title}
            data={chartData}
            tooltipFormatter={imTooltipFormatter(formatMessage)}
            chartKey={`IMChart-${round}-${campaign}`}
            isLoading={isLoading}
            showChart={Boolean(campaign)}
        />
    );
};
