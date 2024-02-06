import { isEqual } from 'lodash';
import { ScaleThreshold } from '../../../components/LegendBuilder/types';

const defaultScaleThreshold = {
    domain: [70, 90],
    range: ['red', 'orange', 'green'],
};

export const useEffectiveThreshold = (
    threshold?: ScaleThreshold,
): ScaleThreshold =>
    !threshold || isEqual(threshold, {}) ? defaultScaleThreshold : threshold;
