import { isEqual } from 'lodash';
import { ScaleThreshold } from '../../../components/LegendBuilder/types';
import { defaultScaleThreshold } from '../components/MapLegend';

export const useEffectiveThreshold = (
    threshold?: ScaleThreshold,
): ScaleThreshold =>
    !threshold || isEqual(threshold, {}) ? defaultScaleThreshold : threshold;
