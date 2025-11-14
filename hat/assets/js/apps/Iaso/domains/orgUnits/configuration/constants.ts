export const apiUrlOUCRC = '/api/orgunits/changes/configs/';
export const apiUrlOUCRCCheckAvailability = `${apiUrlOUCRC}check_availability/`;
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
    name: 'name',
    // 'aliases': 'aliases',  commented out because right now the feature is not ready yet
    openingDate: 'opening_date',
    closedDate: 'closing_date',
    location: 'location',
    possibleTypeIds: 'org_unit_type',
    possibleParentTypeIds: 'parent_type',
    editableReferenceFormIds: 'editable_reference_forms',
    otherGroupIds: 'other_groups',
};
export const editableFieldsManyToManyFields = [
    'possibleTypeIds',
    'possibleParentTypeIds',
    'editableReferenceFormIds',
    'otherGroupIds',
];

export const orgUnitChangeRequestConfigTypeCreation = 'creation';
export const orgUnitChangeRequestConfigTypeEdition = 'edition';
