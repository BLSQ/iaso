import { IntlFormatMessage } from 'bluesquare-components';
import MESSAGES from '../../../constants/messages';
import {
    LqasImDistrictDataWithNameAndRegion,
    ConvertedLqasImData,
    LqasImCampaign,
    LqasImDistrictData,
} from '../../../constants/types';
import {
    OK_COLOR,
    FAIL_COLOR,
    MODERATE_COLOR,
    POOR_COLOR,
} from '../../../styles/constants';
import { makeLegendItem } from '../../../utils';
import {
    accessArrayRound,
    accessDictRound,
    convertStatToPercent,
} from '../shared/LqasIm';
import {
    LQAS_PASS,
    LQAS_POOR,
    LQAS_MODERATE,
    LQAS_OVERSAMPLED,
    LQAS_UNDERSAMPLED,
    LQAS_VERY_POOR,
} from './constants';
import { HASHED_BACKGROUND, IN_SCOPE } from '../shared/constants';

/** @deprecated
 *
 * The API returns the LQAS district status directly.
 * This method is only used to avoid breaking a map component shared with IM
 */
export const determineStatusForDistrict = district => {
    if (!district) return null;
    return district.status;
};

export const getLqasStatsForRound = (
    lqasData: Record<string, ConvertedLqasImData>,
    campaign: string | undefined,
    round: number,
): (
    | '1lqasOK'
    | '3lqaspoor'
    | '3lqasmoderate'
    | '2lqasDisqualified'
    | '3lqasundersampled'
    | '3lqasoversampled'
    | '3lqasverypoor'
    | 'inScope'
    | null
)[][] => {
    if (!campaign || !lqasData[campaign]) return [[], [], [], []];
    const totalEvaluated = accessArrayRound(lqasData[campaign], round).map(
        district => ({
            ...district,
            id: district.district,
        }),
    );
    const allStatuses = totalEvaluated.map(district => {
        return district.status;
    });
    const passed = allStatuses.filter(status => status === LQAS_PASS);
    const failed = allStatuses.filter(status => status === LQAS_VERY_POOR);
    const moderate = allStatuses.filter(status => status === LQAS_MODERATE);
    const poor = allStatuses.filter(status => status === LQAS_POOR);
    const oversampled = allStatuses.filter(
        status => status === LQAS_OVERSAMPLED,
    );
    const undersampled = allStatuses.filter(
        status => status === LQAS_UNDERSAMPLED,
    );
    const inScope = allStatuses.filter(status => status === IN_SCOPE);
    return [passed, moderate, poor, failed, oversampled, undersampled, inScope];
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
        color?: string;
        background?: string;
    }[] => {
        const [passed, moderate, poor, failed, oversampled, undersampled] =
            getLqasStatsForRound(lqasData, campaign, round);
        const noValidDataCount =
            oversampled && undersampled
                ? (oversampled?.length ?? 0) + (undersampled.length ?? 0)
                : '';
        const passedLegendItem = makeLegendItem({
            label: formatMessage(MESSAGES.passing),
            value: passed ? `${passed.length}` : '',
            color: OK_COLOR,
        });
        const failedLegendItem = makeLegendItem({
            label: formatMessage(MESSAGES.verypoor),
            value: failed ? `${failed.length}` : '',
            color: FAIL_COLOR,
        });
        const moderateLegendItem = makeLegendItem({
            label: formatMessage(MESSAGES.moderate),
            value: moderate ? `${moderate.length}` : '',
            color: MODERATE_COLOR,
        });
        const poorLegendItem = makeLegendItem({
            label: formatMessage(MESSAGES.poor),
            value: poor ? `${poor.length}` : '',
            color: POOR_COLOR,
        });
        const noValidDataLegendItem = makeLegendItem({
            label: formatMessage(MESSAGES.noValidData),
            value: `${noValidDataCount}`,
            background: HASHED_BACKGROUND,
        });

        return [
            passedLegendItem,
            moderateLegendItem,
            poorLegendItem,
            failedLegendItem,
            noValidDataLegendItem,
        ];
    };

export const getLqasStatsWithStatus = ({ data, campaign, round }) => {
    if (!data[campaign]) return [];
    return [...accessArrayRound(data[campaign], round)].map(district => ({
        ...district,
        status: district.status,
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
