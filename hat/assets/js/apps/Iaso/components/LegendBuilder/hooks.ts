import { RangeValue, ScaleThreshold } from './types';

export const useGetScaleThreshold = (): ((
    // eslint-disable-next-line no-unused-vars
    rangeValues: RangeValue[],
) => ScaleThreshold) => {
    return rangeValues => {
        let newRangeValues = [...rangeValues];
        newRangeValues.shift();
        newRangeValues = newRangeValues.reverse();
        return {
            domain: newRangeValues.map(range => range.percent),
            range: [...rangeValues].reverse().map(range => range.color),
        };
    };
};
export const useGetRangeValues = (): ((
    // eslint-disable-next-line no-unused-vars
    scaleThreshold?: ScaleThreshold,
) => RangeValue[]) => {
    return scaleThreshold => {
        const { domain, range } = scaleThreshold || { domain: [], range: [] };
        const rangeValues = domain.map((percent, index) => ({
            percent,
            color: range[index],
        }));
        rangeValues.push({
            percent: 100,
            color: range[range.length - 1],
        });
        return rangeValues.reverse().map((rangeValue, index) => ({
            ...rangeValue,
            id: `range-${index + 1}`,
        }));
    };
};
export const useGetThresHoldLabels = (): ((
    // eslint-disable-next-line no-unused-vars
    scaleThreshold?: ScaleThreshold,
) => string[]) => {
    return scaleThreshold => {
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
};
