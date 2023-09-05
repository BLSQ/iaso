import EditableGroup from '../EditableGroup';

import {
    hasFeatureFlag,
    EDIT_GEO_JSON_RIGHT,
    EDIT_CATCHMENT_RIGHT,
} from '../../../../../utils/featureFlags';
import { User } from '../../../../../utils/usersUtils';
import { OrgUnitMapState } from './types';
import { OrgUnit } from '../../../types/orgUnit';
import { buttonsInitialState } from './constants';

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

export const initialState = (currentUser: User): OrgUnitMapState => {
    return {
        locationGroup: new EditableGroup(),
        catchmentGroup: new EditableGroup(),
        canEditLocation: hasFeatureFlag(currentUser, EDIT_GEO_JSON_RIGHT),
        canEditCatchment: hasFeatureFlag(currentUser, EDIT_CATCHMENT_RIGHT),
        currentOption: 'filters',
        formsSelected: [],
        orgUnitTypesSelected: [],
        ancestorWithGeoJson: undefined,
        ...buttonsInitialState,
    };
};
