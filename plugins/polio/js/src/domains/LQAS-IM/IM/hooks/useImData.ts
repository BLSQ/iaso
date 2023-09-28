import { useMemo } from 'react';

import { LQASIMRequestType, useLqasIm } from '../../shared/requests';

import { useDebugData } from '../../shared/hooks/useDebugData';
import { useConvertedLqasImData } from '../../shared/hooks/useConvertedLqasImData';
import { useVerticalChartData } from '../../shared/hooks/useVerticalChartData';
import { useNfmTitle } from '../../shared/hooks/useNfmTitle';
import { useRfaTitle } from '../../shared/hooks/useRfaTitle';
import { useGetCampaigns } from '../../../Campaigns/hooks/api/useGetCampaigns';

import { formatForRfaChart, formatForNfmChart } from '../../shared/LqasIm';

export const useImData = (
    campaign: string,
    country: string,
    imType: LQASIMRequestType,
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
