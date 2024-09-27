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
    'editableReferenceFormIds',
    'otherGroupIds',
];
export const mappingEditableFieldsForBackend = {
    'name': 'name',
    // 'aliases': 'aliases',  commented out because right now the feature is not ready yet
    'openingDate': 'opening_date',
    'closedDate': 'closed_date',
    'location': 'location',
    'possibleTypeIds': 'possible_types',
    'possibleParentTypeIds': 'possible_parent_types',
    'editableReferenceFormIds': 'editable_reference_forms',
    'otherGroupIds': 'other_groups',
}
export const editableFieldsManyToManyFields = [
    'possibleTypeIds',
    'possibleParentTypeIds',
    'editableReferenceFormIds',
    'otherGroupIds',
];
