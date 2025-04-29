import { useMemo } from 'react';

import { LqasImData } from '../../../../constants/types';
import { useConvertedLqasImData } from '../../shared/hooks/useConvertedLqasImData';
import { useDebugData } from '../../shared/hooks/useDebugData';
import { useNfmTitle } from '../../shared/hooks/useNfmTitle';
import { useRfaTitle } from '../../shared/hooks/useRfaTitle';
import { useVerticalChartData } from '../../shared/hooks/useVerticalChartData';

import { formatForRfaChart, formatForNfmChart } from '../../shared/LqasIm';

type UseLQASDataParams = {
    campaign: string;
    country: string;
    selectedRounds: [number, number];
    LQASData?: LqasImData;
};

export const useLqasData = ({
    campaign,
    selectedRounds = [1, 2],
    LQASData,
}: UseLQASDataParams): Record<string, unknown> => {
    const convertedData = useConvertedLqasImData(LQASData);

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
        debugData,
        hasScope,
        chartData,
    };
};
