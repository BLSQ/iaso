import { ViewPort } from '../../../constants/types';
import { vaccineOpacity } from '../Styles';
import { boundariesZoomLimit } from './constants';

export const getGeoJsonStyle = (
    fillColor: string,
    color: string,
    viewport: ViewPort,
): Record<string, string | number | undefined> => {
    return {
        color,
        fillOpacity: vaccineOpacity,
        fillColor,
        weight: viewport.zoom > boundariesZoomLimit ? 2 : 0,
    };
};
