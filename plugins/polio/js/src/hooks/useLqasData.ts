import { useMemo } from 'react';

import { useLqasIm } from '../pages/IM/requests';

import { useDebugData } from './useDebugData';
import { useConvertedLqasImData } from './useConvertedLqasImData';
import { useVerticalChartData } from './useVerticalChartData';
import { useNfmTitle } from './useNfmTitle';
import { useRfaTitle } from './useRfaTitle';
import { useGetCampaigns } from './useGetCampaigns';

import { formatForRfaChart, formatForNfmChart } from '../utils/LqasIm';

export const useLqasData = (
    campaign: string,
    country: string,
): Record<string, unknown> => {
    const { data: LQASData, isFetching } = useLqasIm('lqas', country);

    const convertedData = useConvertedLqasImData(LQASData);

    const { data: campaigns = [], isFetching: campaignsFetching } =
        useGetCampaigns({
            countries: [country],
            enabled: Boolean(country),
        }).query;
    const debugData = useDebugData(LQASData, campaign);

    const hasScope = debugData[campaign]?.hasScope;

    const [nfmRound1, nfmRound2] = useVerticalChartData({
        data: LQASData?.stats,
        campaign,
        formatter: formatForNfmChart,
        type: 'lqas',
    });

    const [nfmTitle1, nfmTitle2] = useNfmTitle({
        data: LQASData?.stats,
        campaign,
        type: 'lqas',
    });

    const [rfaRound1, rfaRound2] = useVerticalChartData({
        data: LQASData?.stats,
        campaign,
        formatter: formatForRfaChart,
        type: 'lqas',
    });

    const [rfaTitle1, rfaTitle2] = useRfaTitle({
        data: LQASData?.stats,
        campaign,
        type: 'lqas',
    });

    const chartData = useMemo(
        () => ({
            nfm: [
                {
                    chartKey: 'nfmRound1',
                    data: nfmRound1,
                    title: nfmTitle1,
                },
                {
                    chartKey: 'nfmRound2',
                    data: nfmRound2,
                    title: nfmTitle2,
                },
            ],
            rfa: [
                {
                    chartKey: 'rfaRound1',
                    data: rfaRound1,
                    title: rfaTitle1,
                },
                {
                    chartKey: 'rfaRound2',
                    data: rfaRound2,
                    title: rfaTitle2,
                },
            ],
            cg: [
                {
                    chartKey: 'rfaRound1',
                    round: 'round_1',
                },
                {
                    chartKey: 'rfaRound2',
                    round: 'round_2',
                },
            ],
        }),
        [
            nfmRound1,
            nfmRound2,
            nfmTitle1,
            nfmTitle2,
            rfaRound1,
            rfaRound2,
            rfaTitle1,
            rfaTitle2,
        ],
    );
    return {
        LQASData,
        isFetching,
        convertedData,
        campaigns,
        campaignsFetching,
        debugData,
        hasScope,
        chartData,
    };
};
