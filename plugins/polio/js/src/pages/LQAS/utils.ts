import MESSAGES from '../../constants/messages';
import { LQAS_PASS, LQAS_FAIL, LQAS_DISQUALIFIED, nfmKeys } from './constants';
import {
    BarChartData,
    LqasCampaign,
    NfmRoundString,
    RoundString,
    IntlFormatMessage,
} from './types';

export const determineStatusForDistrict = district => {
    if (!district) return null;
    const { total_child_fmd: marked, total_child_checked: checked } = district;

    if (checked === 60) {
        if (marked > 56) {
            return LQAS_PASS;
        }
        return LQAS_FAIL;
    }
    return LQAS_DISQUALIFIED;
};

export const getLqasStatsForRound = (lqasData, campaign, round) => {
    if (!lqasData[campaign]) return [[], [], [], []];
    const totalEvaluated = lqasData[campaign][round].map(district => ({
        ...district,
        id: district.district,
    }));
    const allStatuses = totalEvaluated.map(district => {
        return determineStatusForDistrict(district);
    });
    const passed = allStatuses.filter(status => status === LQAS_PASS);
    const disqualified = allStatuses.filter(
        status => status === LQAS_DISQUALIFIED,
    );
    const failed = allStatuses.filter(status => status === LQAS_FAIL);

    return [totalEvaluated, passed, failed, disqualified];
};

const getLqasStatsWithRegion = ({ data, campaign, round, shapes }) => {
    if (!data[campaign]) return [];
    return [...data[campaign][round]].map(district => ({
        ...district,
        region: shapes
            .filter(shape => shape.id === district.district)
            .map(shape => shape.parent_id)[0],
        status: determineStatusForDistrict(district),
    }));
};

export const formatLqasDataForChart = ({
    data,
    campaign,
    round,
    shapes,
    regions,
}) => {
    const dataForRound = getLqasStatsWithRegion({
        data,
        campaign,
        round,
        shapes,
    });
    return regions
        .map(region => {
            const regionData = dataForRound.filter(
                district => district.region === region.id,
            );
            const passing = regionData.filter(
                district => parseInt(district.status, 10) === 1,
            ).length;
            const percentSuccess =
                // fallback to 1 to avoid dividing by zero
                (passing / (regionData.length || 1)) * 100;
            const roundedPercentSuccess = Number.isSafeInteger(percentSuccess)
                ? percentSuccess
                : percentSuccess.toFixed(2);
            return {
                name: region.name,
                value: roundedPercentSuccess,
                found: regionData.length,
                passing,
            };
        })
        .sort((a, b) => a.value < b.value);
};

export const lqasChartTooltipFormatter =
    formatMessage => (_value, _name, props) => {
        // eslint-disable-next-line react/prop-types
        const ratio = `${props.payload.passing}/${props.payload.found}`;
        return [ratio, formatMessage(MESSAGES.passing)];
    };

type FormatForNFMParams = {
    data: Record<string, LqasCampaign>;
    campaign: string;
    round: RoundString;
    formatMessage: IntlFormatMessage;
};

export const lqasNfmTooltipFormatter = (value, _name, props) => {
    // eslint-disable-next-line react/prop-types
    return [value, props.payload.nfmKey];
};

export const formatLqasDataForNFMChart = ({
    data,
    campaign,
    round,
    formatMessage,
}: FormatForNFMParams): BarChartData[] => {
    if (!data || !campaign) return [] as BarChartData[];
    const roundString: string = NfmRoundString[round];
    const campaignData: Record<string, number> = data[campaign][roundString];
    const entries: [string, number][] = Object.entries(campaignData);
    const convertedEntries = entries.map(entry => {
        const [name, value] = entry;
        return { name: formatMessage(MESSAGES[name]), value, nfmKey: name };
    });
    if (convertedEntries.length === nfmKeys.length)
        return convertedEntries.sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'accent' }),
        );
    const dataKeys = Object.keys(campaignData);
    const missingEntries = nfmKeys
        .filter(nfmKey => !dataKeys.includes(nfmKey))
        .map(nfmKey => ({
            name: formatMessage(MESSAGES[nfmKey]),
            value: 0,
            nfmKey,
        }));
    return [...convertedEntries, ...missingEntries].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'accent' }),
    );
};
