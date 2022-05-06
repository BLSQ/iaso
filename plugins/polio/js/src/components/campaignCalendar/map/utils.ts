import { ViewPort } from '../../../constants/types';
import { polioVacines } from '../../../constants/virus';
import { vaccineOpacity } from '../Styles';
import { boundariesZoomLimit } from './constants';

export const getGeoJsonStyle = (
    color: string,
    vaccine: string,
    viewport: ViewPort,
): Record<string, string | number | undefined> => {
    return {
        color,
        fillOpacity: vaccineOpacity,
        fillColor: polioVacines.find(v => v.value === vaccine)?.color,
        weight: viewport.zoom > boundariesZoomLimit ? 2 : 0,
    };
};
