import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    beneficiaries: {
        id: 'iaso.label.beneficiaries',
        defaultMessage: 'Beneficiaries',
    },
    beneficiary: {
        id: 'iaso.label.beneficiary',
        defaultMessage: 'Beneficiary',
    },
    lastVisit: {
        id: 'iaso.entities.lastVisit',
        defaultMessage: 'Last visit',
    },
    program: {
        id: 'iaso.entities.program',
        defaultMessage: 'Program',
    },
    id: {
        defaultMessage: 'Identifier',
        id: 'iaso.label.id',
    },
    nameRequired: {
        id: 'iaso.pages.errors.name',
        defaultMessage: 'Name is required',
    },
    seeDuplicate: {
        id: 'iaso.entities.seeDuplicate',
        defaultMessage: 'See duplicate',
    },
    seeDuplicates: {
        id: 'iaso.entities.seeDuplicates',
        defaultMessage: 'See duplicates',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    viewInstance: {
        id: 'iaso.forms.viewInstance',
        defaultMessage: 'View submission',
    },
    name: {
        defaultMessage: 'Name',
        id: 'iaso.label.name',
    },
    search: {
        defaultMessage: 'Search',
        id: 'iaso.search',
    },
    create: {
        defaultMessage: 'Create entity',
        id: 'iaso.entities.create',
    },
    years: {
        defaultMessage: 'Years',
        id: 'iaso.label.yearNoCap',
    },
    months: {
        defaultMessage: 'Months',
        id: 'iaso.label.monthsLower',
    },
    location: {
        defaultMessage: 'Location',
        id: 'iaso.forms.location',
    },
    dateFrom: {
        defaultMessage: 'Start date',
        id: 'iaso.label.dateFrom',
    },
    dateTo: {
        defaultMessage: 'End date',
        id: 'iaso.label.dateTo',
    },
    map: {
        defaultMessage: 'Map',
        id: 'iaso.label.map',
    },
    list: {
        defaultMessage: 'List',
        id: 'iaso.label.list',
    },
    firstName: {
        defaultMessage: 'First name',
        id: 'iaso.label.firstName',
    },
    lastName: {
        defaultMessage: 'Last name',
        id: 'iaso.label.lastName',
    },
    gender: {
        id: 'iaso.entities.gender',
        defaultMessage: 'Gender',
    },
    age: {
        defaultMessage: 'Age',
        id: 'iaso.label.age',
    },
    unknown: {
        defaultMessage: 'Unknown',
        id: 'iaso.label.unknown',
    },
    nfcCards: {
        defaultMessage: 'NFC Cards',
        id: 'iaso.entities.label.nfcCards',
    },
    edit: {
        defaultMessage: 'Edit',
        id: 'iaso.label.edit',
    },
    submitter: {
        defaultMessage: 'Submitter',
        id: 'iaso.entities.label.submitter',
    },
    submitterTeam: {
        defaultMessage: 'Submitter team',
        id: 'iaso.entities.label.submitterTeam',
    },
    details: {
        defaultMessage: 'Details',
        id: 'iaso.entities.label.details',
    },
    visitDetails: {
        defaultMessage: 'Visit details',
        id: 'iaso.entities.label.visitDetails',
    },
    beneficiaryInfo: {
        defaultMessage: 'Beneficiary information',
        id: 'iaso.entities.label.beneficiaryInfo',
    },
    uuid: {
        defaultMessage: 'Uuid',
        id: 'iaso.label.uuid',
    },
    see: {
        defaultMessage: 'See',
        id: 'iaso.label.see',
    },
    orgUnit: {
        id: 'iaso.instance.org_unit',
        defaultMessage: 'Org unit',
    },
    title: {
        defaultMessage: 'Entities',
        id: 'iaso.entities.title',
    },
    deleteError: {
        id: 'iaso.snackBar.deleteEntityError',
        defaultMessage: 'An error occurred while deleting entity',
    },
    deleteSuccess: {
        id: 'iaso.snackBar.delete_successful',
        defaultMessage: 'Deleted successfully',
    },
    updateMessage: {
        defaultMessage: 'Update entity',
        id: 'iaso.entities.update',
    },
    deleteTitle: {
        id: 'iaso.entities.dialog.deleteTitle',
        defaultMessage: 'Are you sure you want to delete this entity?',
    },
    deleteText: {
        id: 'iaso.label.deleteText',
        defaultMessage: 'This operation cannot be undone.',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    types: {
        defaultMessage: 'Types',
        id: 'iaso.entities.types',
    },
    type: {
        defaultMessage: 'Type',
        id: 'iaso.entities.type',
    },
    updated_at: {
        id: 'iaso.forms.updated_at',
        defaultMessage: 'Updated',
    },
    created_at: {
        id: 'iaso.forms.created_at',
        defaultMessage: 'Created',
    },
    attributes: {
        defaultMessage: 'Submission',
        id: 'iaso.instance.titleSingle',
    },
    registrationDate: {
        id: 'iaso.entities.registrationDate',
        defaultMessage: 'Registration date',
    },
    female: {
        id: 'iaso.entities.female',
        defaultMessage: 'Female',
    },
    male: {
        id: 'iaso.entities.male',
        defaultMessage: 'Male',
    },
    vaccinationNumber: {
        id: 'iaso.entities.vaccinationNumber',
        defaultMessage: 'Vaccination number',
    },
    'org_unit.name': {
        id: 'iaso.instance.org_unit',
        defaultMessage: 'Org unit',
    },
    OrgUnitName: {
        id: 'iaso.instance.org_unit',
        defaultMessage: 'Org unit',
    },
    form: {
        id: 'iaso.instance.form',
        defaultMessage: 'Form',
    },
    last_sync_at: {
        id: 'iaso.entities.label.last_sync_at',
        defaultMessage: 'Last sync',
    },
    keyInfo: {
        id: 'iaso.entities.keyInfo',
        defaultMessage: 'Key information',
    },
    projectsError: {
        id: 'iaso.snackBar.fetchProjectsError',
        defaultMessage: 'An error occurred while fetching projects list',
    },
    submissions: {
        id: 'iaso.instance.title',
        defaultMessage: 'Submissions',
    },
    typeNotSupported: {
        id: 'iaso.entities.typeNotSupported',
        defaultMessage: 'Type not supported yet: {type}',
    },
    all: {
        id: 'iaso.forms.all',
        defaultMessage: 'All',
    },
});

export default MESSAGES;
