import { legendColors } from './colors';
import { RangeValue, ScaleThreshold } from './types';

export const getScaleThreshold = (
    rangeValues: RangeValue[],
): ScaleThreshold => {
    let newRangeValues = [...rangeValues];
    newRangeValues.shift();
    newRangeValues = newRangeValues.reverse();
    return {
        domain: newRangeValues.map(range => range.percent),
        range: [...rangeValues].reverse().map(range => range.color),
    };
};

export const getRangeValues = (
    scaleThreshold?: ScaleThreshold,
): RangeValue[] => {
    const { domain, range } = scaleThreshold || { domain: [], range: [] };
    const rangeValues = domain.map((percent, index) => ({
        percent,
        color: range[index],
    }));
    rangeValues.push({
        percent: 100,
        color: range[range.length - 1] || legendColors[1],
    });
    return rangeValues.reverse().map((rangeValue, index) => ({
        ...rangeValue,
        id: `range-${index + 1}`,
    }));
};
export const getThresHoldLabels = (
    scaleThreshold?: ScaleThreshold,
): string[] => {
    const { domain } = scaleThreshold || { domain: [] };
    const labels = domain.map((percent, index, array) => {
        if (index === 0) {
            return `< ${percent}%`;
        }
        return `${array[index - 1]}% - ${percent}%`;
    });
    if (domain.length > 0) {
        labels.push(`> ${domain[domain.length - 1]}%`);
    }
    return labels;
};
