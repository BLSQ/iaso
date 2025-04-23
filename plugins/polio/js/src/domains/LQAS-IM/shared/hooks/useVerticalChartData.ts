import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import {
    BarChartData,
    FormatForNFMArgs,
    LqasImCampaign,
} from '../../../../constants/types';

type Params = {
    data?: Record<string, LqasImCampaign>;
    campaign?: string;
    formatter: (args: FormatForNFMArgs<string>) => BarChartData[];
    type: string;
    selectedRounds: [number, number];
};

export const useVerticalChartData = ({
    data,
    campaign,
    formatter,
    type,
    selectedRounds,
}: Params): BarChartData[][] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            formatter({
                data,
                campaign,
                round: selectedRounds[0],
                formatMessage,
                type,
            }),
            formatter({
                data,
                campaign,
                round: selectedRounds[1],
                formatMessage,
                type,
            }),
        ];
    }, [formatter, data, campaign, selectedRounds, formatMessage, type]);
};
