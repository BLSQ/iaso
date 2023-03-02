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
    selectedRounds: [number, number],
): Record<string, unknown> => {
    const { data: imData, isFetching } = useLqasIm(imType, country);
    const convertedData = useConvertedLqasImData(imData);
    const { data: campaigns = [], isFetching: campaignsFetching } =
        useGetCampaigns({
            countries: [country],
            enabled: Boolean(country),
        });
    const debugData = useDebugData(imData, campaign);
    const hasScope = debugData[campaign]?.hasScope;

    const [nfmLeft, nfmRight] = useVerticalChartData({
        data: imData?.stats,
        campaign,
        formatter: formatForNfmChart,
        type: 'im',
        selectedRounds,
    });
    const [nfmTitleLeft, nfmTitleRight] = useNfmTitle({
        data: imData?.stats,
        campaign,
        type: 'im',
        selectedRounds,
    });

    const [rfaLeft, rfaRight] = useVerticalChartData({
        data: imData?.stats,
        campaign,
        formatter: formatForRfaChart,
        type: 'im',
        selectedRounds,
    });

    const [rfaTitleLeft, rfaTitleRight] = useRfaTitle({
        data: imData?.stats,
        campaign,
        type: 'im',
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
                    title: rfaTitleLeft,
                },
                {
                    chartKey: 'rfaRight',
                    data: rfaRight,
                    title: rfaTitleRight,
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
            rfaTitleLeft,
            rfaTitleRight,
            selectedRounds,
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
