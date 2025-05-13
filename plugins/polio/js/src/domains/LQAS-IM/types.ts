import { ParamsWithAccountId } from 'Iaso/routing/hooks/useParamsObject';
import { BarChartData } from '../../constants/types';

export type LqasImFilterParams = {
    campaign: string | undefined;
    country: string | undefined;
    rounds: string | undefined;
};

export type LqasImUrlParams = LqasImFilterParams & ParamsWithAccountId;

export type ChartDataEntry = {
    chartKey: string;
    data: BarChartData[];
    title: string;
};
export type ChartData = {
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

export type LqasImDebugData = Record<
    string,
    { hasScope: boolean; districtsNotFound: string[] }
>;
