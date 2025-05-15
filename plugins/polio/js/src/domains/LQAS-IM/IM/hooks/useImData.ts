import { useMemo } from 'react';
import { UseQueryResult } from 'react-query';
import { useLqasIm } from '../../shared/hooks/api/useLqasIm';
import { useConvertedLqasImData } from '../../shared/hooks/useConvertedLqasImData';
import { useDebugData } from '../../shared/hooks/useDebugData';
import { useNfmTitle } from '../../shared/hooks/useNfmTitle';
import { useRfaTitle } from '../../shared/hooks/useRfaTitle';
import { useVerticalChartData } from '../../shared/hooks/useVerticalChartData';
import { formatForRfaChart, formatForNfmChart } from '../../shared/LqasIm';
import {
    BarChartData,
    ChartData,
    ConvertedLqasImData,
    LqasImData,
    LqasImDebugData,
    LqasIMType,
} from '../../types';

type UseImDataParams = {
    campaign?: string;
    country?: string;
    imType: LqasIMType;
    selectedRounds: [number | undefined, number | undefined];
};

export type UseImData = {
    imData?: LqasImData;
    isFetching: boolean;
    convertedData: Record<string, ConvertedLqasImData>;
    debugData: LqasImDebugData;
    hasScope: boolean;
    chartData: ChartData;
};

export const useImData = ({
    campaign,
    country,
    imType,
    selectedRounds,
}: UseImDataParams): UseImData => {
    const { data: imData, isFetching }: UseQueryResult<LqasImData> = useLqasIm(
        imType,
        country,
    );
    const convertedData = useConvertedLqasImData(imData);

    const debugData = useDebugData(imData, campaign);
    const hasScope = campaign ? Boolean(debugData[campaign]?.hasScope) : false;

    const [nfmLeft, nfmRight]: [BarChartData[], BarChartData[]] =
        useVerticalChartData({
            data: imData?.stats,
            campaign,
            formatter: formatForNfmChart,
            type: 'im',
            selectedRounds,
        });
    const [nfmTitleLeft, nfmTitleRight]: [string, string] = useNfmTitle({
        data: imData?.stats,
        campaign,
        type: 'im',
        selectedRounds,
    });

    const [rfaLeft, rfaRight]: [BarChartData[], BarChartData[]] =
        useVerticalChartData({
            data: imData?.stats,
            campaign,
            formatter: formatForRfaChart,
            type: 'im',
            selectedRounds,
        });

    const [rfaTitleLeft, rfaTitleRight]: [string, string] = useRfaTitle({
        data: imData?.stats,
        campaign,
        type: 'im',
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
        debugData,
        hasScope,
        chartData,
    };
};
