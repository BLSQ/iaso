import { useMemo } from 'react';

import { useLqasIm } from '../pages/IM/requests';

import { useDebugData } from './useDebugData';
import { useConvertedLqasImData } from './useConvertedLqasImData';
import { useVerticalChartData } from './useVerticalChartData';
import { useNfmTitle } from './useNfmTitle';
import { useRfaTitle } from './useRfaTitle';
import { useGetCampaigns } from './useGetCampaigns';

import { formatForRfaChart, formatForNfmChart } from '../utils/LqasIm';

export const useImData = (
    campaign: string,
    country: string,
    imType: string,
): Record<string, unknown> => {
    const { data: imData, isFetching } = useLqasIm(imType, country);
    const convertedData = useConvertedLqasImData(imData);
    const { data: campaigns = [], isFetching: campaignsFetching } =
        useGetCampaigns({
            countries: [country],
            enabled: Boolean(country),
        }).query;

    const debugData = useDebugData(imData, campaign);
    const hasScope = debugData[campaign]?.hasScope;

    const [nfmRound1, nfmRound2] = useVerticalChartData({
        data: imData?.stats,
        campaign,
        formatter: formatForNfmChart,
        type: 'im',
    });
    const [nfmTitle1, nfmTitle2] = useNfmTitle({
        data: imData?.stats,
        campaign,
        type: 'im',
    });

    const [rfaRound1, rfaRound2] = useVerticalChartData({
        data: imData?.stats,
        campaign,
        formatter: formatForRfaChart,
        type: 'im',
    });

    const [rfaTitle1, rfaTitle2] = useRfaTitle({
        data: imData?.stats,
        campaign,
        type: 'im',
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
        imData,
        isFetching,
        convertedData,
        campaigns,
        campaignsFetching,
        debugData,
        hasScope,
        chartData,
    };
};
