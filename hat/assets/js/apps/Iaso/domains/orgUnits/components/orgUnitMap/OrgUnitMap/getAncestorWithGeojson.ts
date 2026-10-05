import { OrgUnit } from '../../../types/orgUnit';

// No leaflet in here: also used by the MapLibre map
export const getAncestorWithGeojson = (orgUnit: OrgUnit): OrgUnit => {
    let ancestorWithGeoJson;
    for (let ancestor = orgUnit.parent; ancestor; ancestor = ancestor.parent) {
        if (ancestor.geo_json) {
            ancestorWithGeoJson = ancestor;
            break;
        }
    }
    return ancestorWithGeoJson;
};
