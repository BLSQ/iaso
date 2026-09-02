import { AccountRetrieveCurrent } from 'Iaso/api/accounts';
import {
    hasFeatureFlag,
    EDIT_GEO_JSON_RIGHT,
    EDIT_CATCHMENT_RIGHT,
} from '../../../../../utils/featureFlags';
import { OrgUnit } from '../../../types/orgUnit';
import EditableGroup from '../EditableGroup';
import { buttonsInitialState } from './constants';
import { OrgUnitMapState } from './types';

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

export const initialState = (
    account?: AccountRetrieveCurrent,
): OrgUnitMapState => {
    return {
        locationGroup: new EditableGroup(),
        catchmentGroup: new EditableGroup(),
        canEditLocation: hasFeatureFlag(EDIT_GEO_JSON_RIGHT, account),
        canEditCatchment: hasFeatureFlag(EDIT_CATCHMENT_RIGHT, account),
        currentOption: 'filters',
        formsSelected: [],
        orgUnitTypesSelected: [],
        ancestorWithGeoJson: undefined,
        ...buttonsInitialState,
    };
};
