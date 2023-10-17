import { IntlFormatMessage } from 'bluesquare-components';
import MESSAGES from '../../../constants/messages';
import {
    LqasImDistrictDataWithNameAndRegion,
    ConvertedLqasImData,
    LqasImCampaign,
    LqasImDistrictData,
} from '../../../constants/types';
import { OK_COLOR, FAIL_COLOR } from '../../../styles/constants';
import { makeLegendItem } from '../../../utils';
import {
    accessArrayRound,
    accessDictRound,
    convertStatToPercent,
} from '../shared/LqasIm';
import { LQAS_FAIL, LQAS_PASS } from './constants';

export const determineStatusForDistrict = district => {
    if (!district) return null;
    const { total_child_fmd: marked, total_child_checked: checked } = district;

    if (checked === 60) {
        if (marked > 56) {
            return LQAS_PASS;
        }
    }
    return LQAS_FAIL;
};

export const getLqasStatsForRound = (
    lqasData: Record<string, ConvertedLqasImData>,
    campaign: string | undefined,
    round: number,
): ('1lqasOK' | '3lqasFail' | '2lqasDisqualified' | null)[][] => {
    if (!campaign || !lqasData[campaign]) return [[], [], [], []];
    const totalEvaluated = accessArrayRound(lqasData[campaign], round).map(
        district => ({
            ...district,
            id: district.district,
        }),
    );
    const allStatuses = totalEvaluated.map(district => {
        return determineStatusForDistrict(district);
    });
    const passed = allStatuses.filter(status => status === LQAS_PASS);
    const failed = allStatuses.filter(status => status === LQAS_FAIL);
    return [passed, failed];
};

export const makeLqasMapLegendItems =
    (formatMessage: IntlFormatMessage) =>
    (
        lqasData: Record<string, ConvertedLqasImData>,
        campaign: string | undefined,
        round: number,
    ): {
        label: string;
        value: string;
        color: any;
    }[] => {
        const [passed, failed] = getLqasStatsForRound(
            lqasData,
            campaign,
            round,
        );
        const passedLegendItem = makeLegendItem({
            color: OK_COLOR,
            value: passed?.length,
            message: formatMessage(MESSAGES.passing),
        });
        const failedLegendItem = makeLegendItem({
            color: FAIL_COLOR,
            value: failed?.length,
            message: formatMessage(MESSAGES.failing),
        });

        return [passedLegendItem, failedLegendItem];
    };

export const getLqasStatsWithStatus = ({ data, campaign, round }) => {
    if (!data[campaign]) return [];
    return [...accessArrayRound(data[campaign], round)].map(district => ({
        ...district,
        status: determineStatusForDistrict(district),
    }));
};

export const formatLqasDataForChart = ({ data, campaign, round, regions }) => {
    const dataForRound = getLqasStatsWithStatus({
        data,
        campaign,
        round,
    });
    const regionsList: any[] = [];
    regions.forEach(region => {
        const regionData = dataForRound.filter(
            district => district.region_name === region.name,
        );
        if (regionData.length > 0) {
            const passing = regionData.filter(
                district => parseInt(district.status ?? '', 10) === 1,
            ).length;
            const percentSuccess =
                // fallback to 1 to avoid dividing by zero
                (passing / regionData.length) * 100;
            const roundedPercentSuccess = Number.isSafeInteger(percentSuccess)
                ? percentSuccess
                : Math.round(percentSuccess);

            regionsList.push({
                name: region.name,
                value: roundedPercentSuccess,
                found: regionData.length,
                passing,
            });
        }
    });
    return regionsList.sort(
        (a, b) => parseFloat(b.value) - parseFloat(a.value),
    );
};

export const lqasChartTooltipFormatter =
    formatMessage => (_value, _name, props) => {
        // eslint-disable-next-line react/prop-types
        const ratio = `${props.payload.passing}/${props.payload.found}`;
        return [ratio, formatMessage(MESSAGES.passing)];
    };

export const sumChildrenCheckedLqas = (
    round: number,
    data?: Record<string, LqasImCampaign>,
    campaign?: string,
): number => {
    if (!data || !campaign || !data[campaign]) return 0;
    const roundData: LqasImDistrictData[] = Object.values(
        accessDictRound(data[campaign], round),
    );
    return roundData
        .filter(rd => rd.total_child_checked === 60)
        .reduce((total, current) => total + current.total_child_checked, 0);
};

export const makeDataForTable = (
    data: Record<string, ConvertedLqasImData>,
    campaign: string,
    round: number,
): LqasImDistrictDataWithNameAndRegion[] => {
    if (!data || !campaign || !data[campaign]) return [];
    return accessArrayRound(data[campaign], round);

    // removed the filter so that the table reflects the total numbers of its title/header
    // we should probably filter the not found everywhere, but we would have inconsistencies anyway because of the current backend implementation of nfm
    // return data[campaign][round].filter(roundData =>
    //     Boolean(roundData.district),
    // );
};

export const makeCaregiversRatio = (
    data: LqasImDistrictDataWithNameAndRegion[],
): string => {
    const { caregiversInformed, childrenChecked } = data.reduce(
        (total, current) => {
            return {
                caregiversInformed:
                    total.caregiversInformed +
                    (current.care_giver_stats?.caregivers_informed ?? 0),
                childrenChecked:
                    total.childrenChecked + current.total_child_checked,
            };
        },
        { childrenChecked: 0, caregiversInformed: 0 },
    );
    return convertStatToPercent(caregiversInformed, childrenChecked);
};

export const findRegionShape = (shape, regionShapes) => {
    return regionShapes.filter(
        regionShape => regionShape.id === shape.parent_id,
    )[0]?.name;
};
