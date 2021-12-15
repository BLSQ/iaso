import { IM_PASS, IM_FAIL, IM_WARNING } from './constants';

export const determineStatusForDistrict = district => {
    if (!district) return null;
    const ratio =
        (district.total_child_fmd / district.total_child_checked) * 100;
    if (ratio >= 95) return IM_PASS;
    if (ratio > 89 && ratio < 95) return IM_WARNING;
    return IM_FAIL;
};

// const determineRatioForDistrict = district => {
//     const ratio =
//         (district.total_child_fmd / district.total_child_checked) * 100;
//     return Number.isSafeInteger(ratio) ? ratio : ratio.toFixed(2);
// };

export const getImStatsForRound = (imData, campaign, round) => {
    if (!imData[campaign]) return [[], [], [], []];
    const totalEvaluated = [...imData[campaign][round]];
    const allStatuses = totalEvaluated.map(district => {
        return determineStatusForDistrict(district);
    });
    const passed = allStatuses.filter(status => status === IM_PASS);
    const disqualified = allStatuses.filter(status => status === IM_WARNING);
    const failed = allStatuses.filter(status => status === IM_FAIL);

    return [totalEvaluated, passed, failed, disqualified];
};

// FIXME duplicate with lqas
const getImStatsWithRegion = ({ data, campaign, round, shapes }) => {
    if (!data[campaign]) return [];
    return [...data[campaign][round]].map(district => ({
        ...district,
        region: shapes
            .filter(shape => shape.id === district.district)
            .map(shape => shape.parent_id)[0],
        // status: determineStatusForDistrict(district),
        // childrenWithMark: district.total_child_fmd,
        // childrenChecked: district.total_child_checked,
    }));
};

export const formatImDataForChart = ({
    data,
    campaign,
    round,
    shapes,
    regions,
}) => {
    const dataForRound = getImStatsWithRegion({
        data,
        campaign,
        round,
        shapes,
    });
    return regions.map(region => {
        const regionData = dataForRound.filter(
            district => district.region === region.id,
        );
        const aggregatedData = regionData
            .map(district => ({
                marked: district.total_child_fmd,
                checked: district.total_child_checked,
            }))
            .reduce(
                (total, current) => {
                    return {
                        marked: total.marked + current.marked,
                        checked: total.checked + current.checked,
                    };
                },
                { marked: 0, checked: 0 },
            );
        const { checked, marked } = aggregatedData;
        // forcing aggregatedData.checked to 1 to avoid dividing by 0
        const markedRatio = (marked / (checked || 1)) * 100;
        return {
            name: region.name,
            value: Number.isSafeInteger(markedRatio)
                ? markedRatio
                : markedRatio.toFixed(2),
            marked: aggregatedData.marked,
            checked: aggregatedData.checked,
        };
    });
};

export const imTooltipFormatter = (value, name, props) => {
    // eslint-disable-next-line react/prop-types
    const ratio = `${props.payload.checked}/${props.payload.marked}`;
    return [ratio, 'vaccinated'];
};
