import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import {
    FormatForNFMArgs,
    BarChartData,
    LqasImCampaign,
} from '../constants/types';

type Params = {
    data?: Record<string, LqasImCampaign>;
    campaign?: string;
    // eslint-disable-next-line no-unused-vars
    formatter: (args: FormatForNFMArgs<string>) => BarChartData[];
    type: string;
};

export const useVerticalChartData = ({
    data,
    campaign,
    formatter,
    type,
}: Params): BarChartData[][] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            formatter({
                data,
                campaign,
                round: 'round_1',
                formatMessage,
                type,
            }),
            formatter({
                data,
                campaign,
                round: 'round_2',
                formatMessage,
                type,
            }),
        ];
    }, [data, campaign, formatter, formatMessage, type]);
};
