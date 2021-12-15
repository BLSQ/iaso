import { LQAS_PASS, LQAS_FAIL, LQAS_DISQUALIFIED } from './constants';

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
    return regions.map(region => {
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
    });
};

export const lqasChartTooltipFormatter = (value, name, props) => {
    // eslint-disable-next-line react/prop-types
    const ratio = `${props.payload.passing}/${props.payload.found}`;
    return [ratio, 'passing'];
};
