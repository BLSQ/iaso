import { useMemo } from 'react';
import { Side } from '../../../../constants/types';
import { useConvertedLqasImData } from '../../shared/hooks/useConvertedLqasImData';
import { useDebugData } from '../../shared/hooks/useDebugData';
import { formatForNfmChart, formatForRfaChart } from '../../shared/LqasIm';
import {
    BarChartData,
    ConvertedLqasImData,
    LqasChartData,
    LqasImData,
    LqasImDebugData,
} from '../../types';
import {
    useLqasNfmTitle,
    useLqasRfaTitle,
    useLqasVerticalChartData,
} from './utils';

type UseLqasCountryDataArgs = {
    campaignObrName?: string;
    roundNumber?: number;
    lqasData?: LqasImData;
    side: Side;
};

export type UseLqasCountryDataResult = {
    convertedData: Record<string, ConvertedLqasImData>;
    debugData: LqasImDebugData;
    hasScope: boolean;
    chartData: LqasChartData;
};

export const useLqasCountryData = ({
    campaignObrName,
    lqasData,
    roundNumber,
    side,
}: UseLqasCountryDataArgs): UseLqasCountryDataResult => {
    const convertedData: Record<string, ConvertedLqasImData> =
        useConvertedLqasImData(lqasData);

    const debugData: Record<
        string,
        { hasScope: boolean; districtsNotFound: string[] }
    > = useDebugData(lqasData, campaignObrName);

    const hasScope = campaignObrName
        ? Boolean(debugData[campaignObrName]?.hasScope)
        : false;

    const lqasNfmData: BarChartData[] = useLqasVerticalChartData({
        data: lqasData?.stats,
        campaignObrName,
        formatter: formatForNfmChart,
        type: 'lqas',
        roundNumber,
    });

    const lqasNfmTitle: string = useLqasNfmTitle({
        data: lqasData?.stats,
        campaignObrName,
        roundNumber,
    });

    const lqasRfaData: BarChartData[] = useLqasVerticalChartData({
        data: lqasData?.stats,
        campaignObrName,
        formatter: formatForRfaChart,
        type: 'lqas',
        roundNumber,
    });
    const lqasRfaTitle: string = useLqasRfaTitle({
        data: lqasData?.stats,
        campaignObrName,
        roundNumber,
    });

    const chartData: LqasChartData = useMemo(
        () => ({
            nfm: {
                chartKey: `${side}Rfa`,
                data: lqasNfmData,
                title: lqasNfmTitle,
            },
            rfa: {
                chartKey: `${side}Rfa`,
                data: lqasRfaData,
                title: lqasRfaTitle,
            },

            cg: {
                chartKey: `${side}Rfa`,
                round: roundNumber,
            },
        }),
        [
            lqasNfmData,
            lqasNfmTitle,
            lqasRfaData,
            lqasRfaTitle,
            side,
            roundNumber,
        ],
    );
    return useMemo(
        () => ({
            convertedData,
            debugData,
            hasScope,
            chartData,
        }),
        [convertedData, debugData, hasScope, chartData],
    );
};
