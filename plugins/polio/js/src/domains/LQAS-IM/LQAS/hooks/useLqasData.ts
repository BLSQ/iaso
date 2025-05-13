import { useMemo } from 'react';

import {
    BarChartData,
    ConvertedLqasImData,
    LqasImData,
} from '../../../../constants/types';
import { useConvertedLqasImData } from '../../shared/hooks/useConvertedLqasImData';
import { useDebugData } from '../../shared/hooks/useDebugData';
import { useNfmTitle } from '../../shared/hooks/useNfmTitle';
import { useRfaTitle } from '../../shared/hooks/useRfaTitle';
import { useVerticalChartData } from '../../shared/hooks/useVerticalChartData';

import { formatForRfaChart, formatForNfmChart } from '../../shared/LqasIm';

type UseLQASDataParams = {
    campaign?: string;
    country?: string;
    selectedRounds: [number | undefined, number | undefined];
    LQASData?: LqasImData;
};

type ChartDataEntry = {
    chartKey: string;
    data: BarChartData[];
    title: string;
};
type ChartData = {
    nfm: [ChartDataEntry, ChartDataEntry];
    rfa: [ChartDataEntry, ChartDataEntry];
    cg: [
        {
            chartKey: 'rfaLeft';
            round: number | undefined;
        },
        {
            chartKey: 'rfaRight';
            round: number | undefined;
        },
    ];
};

export type UseLQASData = {
    convertedData: Record<string, ConvertedLqasImData>;
    debugData: Record<
        string,
        { hasScope: boolean; districtsNotFound: string[] }
    >;
    hasScope: boolean;
    chartData: ChartData;
};

export const useLqasData = ({
    campaign,
    selectedRounds = [1, 2],
    LQASData,
}: UseLQASDataParams): UseLQASData => {
    const convertedData: Record<string, ConvertedLqasImData> =
        useConvertedLqasImData(LQASData);

    const debugData: Record<
        string,
        { hasScope: boolean; districtsNotFound: string[] }
    > = useDebugData(LQASData, campaign);

    const hasScope = campaign ? Boolean(debugData[campaign]?.hasScope) : false;

    const [nfmLeft, nfmRight]: [BarChartData[], BarChartData[]] =
        useVerticalChartData({
            data: LQASData?.stats,
            campaign,
            formatter: formatForNfmChart,
            type: 'lqas',
            selectedRounds,
        });

    const [nfmTitleLeft, nfmTitleRight]: [string, string] = useNfmTitle({
        data: LQASData?.stats,
        campaign,
        type: 'lqas',
        selectedRounds,
    });

    const [rfaLeft, rfaRight]: [BarChartData[], BarChartData[]] =
        useVerticalChartData({
            data: LQASData?.stats,
            campaign,
            formatter: formatForRfaChart,
            type: 'lqas',
            selectedRounds,
        });

    const [rfaTitle1, rfaTitle2]: [string, string] = useRfaTitle({
        data: LQASData?.stats,
        campaign,
        type: 'lqas',
        selectedRounds,
    });

    const chartData: ChartData = useMemo(
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
