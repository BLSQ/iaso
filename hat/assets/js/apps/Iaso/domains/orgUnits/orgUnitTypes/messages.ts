import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    name: {
        id: 'iaso.label.name',
        defaultMessage: 'Name',
    },
    shortName: {
        id: 'iaso.orgUnits.shortName',
        defaultMessage: 'Short name',
    },
    search: {
        id: 'iaso.search',
        defaultMessage: 'Search',
    },
    orgUnitsTypes: {
        defaultMessage: 'Org unit types',
        id: 'iaso.label.orgUnitsTypes',
    },
    create: {
        id: 'iaso.orgUnitsTypes.create',
        defaultMessage: 'Create org unit type',
    },
    updatedAt: {
        id: 'iaso.forms.updated_at',
        defaultMessage: 'Updated',
    },
    createdAt: {
        id: 'iaso.label.created',
        defaultMessage: 'Creation',
    },
    orgUnit: {
        id: 'iaso.label.orgUnit',
        defaultMessage: 'Org units',
    },
    validatedOrgUnitCount: {
        id: 'iaso.label.validatedOrgUnitCount',
        defaultMessage: 'Validated org units',
    },
    actions: {
        id: 'iaso.label.actions',
        defaultMessage: 'Action(s)',
    },
    update: {
        id: 'iaso.orgUnitsTypes.update',
        defaultMessage: 'Update org unit type',
    },
    delete: {
        id: 'iaso.orgUnitsTypes.dialog.delete',
        defaultMessage: 'Are you sure you want to delete this org unit type?',
    },
    deleteWarning: {
        id: 'iaso.orgUnitsTypes.dialog.deleteText',
        defaultMessage: 'This operation cannot be undone.',
    },
    edit: {
        id: 'iaso.label.edit',
        defaultMessage: 'Edit',
    },
    subUnitTypes: {
        id: 'iaso.orgUnits.subOrgUnitsType',
        defaultMessage: 'Sub org units types',
    },
    createSubUnitTypes: {
        id: 'iaso.orgUnits.createSubUnitTypes',
        defaultMessage: 'Sub org units types to create',
    },
    createSubUnitTypesInfos: {
        id: 'iaso.orgUnits.createSubUnitTypesInfos',
        defaultMessage:
            'Allow the creation of these sub org unit types (mobile)',
    },
    projects: {
        id: 'iaso.orgUnitsTypes.projects',
        defaultMessage: 'Projects',
    },
    depth: {
        id: 'iaso.orgUnits.depth',
        defaultMessage: 'Depth',
    },
    depthInfos: {
        id: 'iaso.orgUnits.depthInfos',
        defaultMessage: 'Depth of the type in the hierarchy',
    },
    referenceForm: {
        id: 'iaso.orgUnits.referenceForm',
        defaultMessage: 'Reference form',
    },
    referenceForms: {
        id: 'iaso.orgUnits.referenceForms',
        defaultMessage: 'Reference forms',
    },
    selectProjects: {
        id: 'iaso.orgUnits.selectProjects',
        defaultMessage: 'select a project',
    },
    requiredField: {
        id: 'iaso.forms.error.fieldRequired',
        defaultMessage: 'This field is required',
    },
    subTypesErrors: {
        id: 'iaso.orgUnitsTypes.subTypesErrors',
        defaultMessage:
            'A sub org unit type cannot be a parent too ({typeName})',
    },
    confirm: {
        id: 'iaso.label.confirm',
        defaultMessage: 'Confirm',
    },
    eraseReferenceFormsWarning: {
        id: 'iaso.orgUnitsTypes.dialog.eraseReferenceFormsWarning',
        defaultMessage:
            'Watch out! Adding an extra project to this list will erase all the currently selected reference forms ' +
            'for the project(s), and you will need to select them again in the list (to avoid inconsistencies, ' +
            'as reference forms must be included in all selected projects). Are you sure you want to proceed?',
    },
});

export default MESSAGES;
