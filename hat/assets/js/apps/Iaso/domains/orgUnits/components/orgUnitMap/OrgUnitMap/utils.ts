import {
    hasFeatureFlag,
    EDIT_GEO_JSON_RIGHT,
    EDIT_CATCHMENT_RIGHT,
} from '../../../../../utils/featureFlags';
import { User } from '../../../../../utils/usersUtils';
import EditableGroup from '../EditableGroup';
import { buttonsInitialState } from './constants';
import { OrgUnitMapState } from './types';

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
