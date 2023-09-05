import { useMemo } from 'react';

import { useDebugData } from './useDebugData';
import { useConvertedLqasImData } from './useConvertedLqasImData';
import { useVerticalChartData } from './useVerticalChartData';
import { useNfmTitle } from './useNfmTitle';
import { useRfaTitle } from './useRfaTitle';
import { useGetCampaigns } from './useGetCampaigns';

import { formatForRfaChart, formatForNfmChart } from '../utils/LqasIm';
import { LqasImData } from '../constants/types';

type UseLQASDataParams = {
    campaign: string;
    country: string;
    selectedRounds: [number, number];
    LQASData?: LqasImData;
};

export const useLqasData = ({
    campaign,
    country,
    selectedRounds = [1, 2],
    LQASData,
}: UseLQASDataParams): Record<string, unknown> => {
    const convertedData = useConvertedLqasImData(LQASData);

    const { data: campaigns = [], isFetching: campaignsFetching } =
        useGetCampaigns({
            countries: [country],
            enabled: Boolean(country),
        });

    const debugData = useDebugData(LQASData, campaign);

    const hasScope = debugData[campaign]?.hasScope;

    const [nfmLeft, nfmRight] = useVerticalChartData({
        data: LQASData?.stats,
        campaign,
        formatter: formatForNfmChart,
        type: 'lqas',
        selectedRounds,
    });

    const [nfmTitleLeft, nfmTitleRight] = useNfmTitle({
        data: LQASData?.stats,
        campaign,
        type: 'lqas',
        selectedRounds,
    });

    const [rfaLeft, rfaRight] = useVerticalChartData({
        data: LQASData?.stats,
        campaign,
        formatter: formatForRfaChart,
        type: 'lqas',
        selectedRounds,
    });

    const [rfaTitle1, rfaTitle2] = useRfaTitle({
        data: LQASData?.stats,
        campaign,
        type: 'lqas',
        selectedRounds,
    });
    const chartData = useMemo(
        () => ({
            nfm: [
                {
                    chartKey: 'nfmLeft',
                    data: nfmLeft,
                    title: nfmTitleLeft,
                },
                {
                    chartKey: 'nfmRight',
                    data: nfmRight,
                    title: nfmTitleRight,
                },
            ],
            rfa: [
                {
                    chartKey: 'rfaLeft',
                    data: rfaLeft,
                    title: rfaTitle1,
                },
                {
                    chartKey: 'rfaRight',
                    data: rfaRight,
                    title: rfaTitle2,
                },
            ],
            cg: [
                {
                    chartKey: 'rfaLeft',
                    round: selectedRounds[0],
                },
                {
                    chartKey: 'rfaRight',
                    round: selectedRounds[1],
                },
            ],
        }),
        [
            nfmLeft,
            nfmRight,
            nfmTitleLeft,
            nfmTitleRight,
            rfaLeft,
            rfaRight,
            rfaTitle1,
            rfaTitle2,
            selectedRounds,
        ],
    );
    return {
        convertedData,
        campaigns,
        campaignsFetching,
        debugData,
        hasScope,
        chartData,
    };
};
