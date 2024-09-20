export const apiUrlOUCRC = '/api/orgunits/changes/configs/';
export const apiUrlOUCRCCheckAvailability = `${apiUrlOUCRC}check_availability/`;
export const apiUrlForms = '/api/forms/';
export const editableFields = [
    'name',
    // 'aliases',  commented out because right now the feature is not ready yet
    'openingDate',
    'closedDate',
    'location',
    'possibleTypeIds',
    'possibleParentTypeIds',
    'groupSetIds',
    'editableReferenceFormIds',
    'otherGroupIds',
];
// only these values are allowed by the backend, the others are there to make fields appear
export const editableFieldsForBackend = [
    'name',
    // 'aliases',  commented out because right now the feature is not ready yet
    'openingDate',
    'closedDate',
    'location',
];
export const editableFieldsForFrontend = [
    'possibleTypeIds',
    'possibleParentTypeIds',
    'groupSetIds',
    'editableReferenceFormIds',
    'otherGroupIds',
];
