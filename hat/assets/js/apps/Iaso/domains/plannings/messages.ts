import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    title: {
        defaultMessage: 'Planning',
        id: 'iaso.planning.title',
    },
    search: {
        defaultMessage: 'Search',
        id: 'iaso.search',
    },
    publishingStatus: {
        defaultMessage: 'Publishing status',
        id: 'iaso.label.publishingStatus',
    },
    all: {
        defaultMessage: 'All',
        id: 'iaso.label.all',
    },
    draft: {
        defaultMessage: 'Draft',
        id: 'iaso.label.draft',
    },
    published: {
        defaultMessage: 'Published',
        id: 'iaso.label.published',
    },
    startDatefrom: {
        id: 'iaso.label.startDatefrom',
        defaultMessage: 'Start date from',
    },
    endDateUntil: {
        id: 'iaso.label.endDateUntil',
        defaultMessage: 'End date until',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    name: {
        defaultMessage: 'Name',
        id: 'iaso.label.name',
    },
    startDate: {
        id: 'iaso.label.dateFrom',
        defaultMessage: 'Start date',
    },
    endDate: {
        id: 'iaso.label.dateTo',
        defaultMessage: 'End date',
    },
    yes: {
        defaultMessage: 'Yes',
        id: 'iaso.label.yes',
    },
    no: {
        defaultMessage: 'No',
        id: 'iaso.label.no',
    },
    team: {
        defaultMessage: 'Team',
        id: 'iaso.label.team',
    },
    viewPlanning: {
        defaultMessage: 'View planning',
        id: 'iaso.label.viewPlanning',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    editPlanning: {
        id: 'iaso.label.editPlanning',
        defaultMessage: 'Edit planning',
    },
    createPlanning: {
        id: 'iaso.label.createPlanning',
        defaultMessage: 'Create planning',
    },
    forms: {
        defaultMessage: 'Forms',
        id: 'iaso.forms.title',
    },
    edit: {
        id: 'iaso.label.edit',
        defaultMessage: 'Edit',
    },
    selectOrgUnit: {
        id: 'iaso.plannings.label.selectOrgUnit',
        defaultMessage: 'Please select org unit',
    },
    duplicatePlanning: {
        id: 'iaso.plannings.label.duplicatePlanning',
        defaultMessage: 'Duplicate planning',
    },
    requiredField: {
        id: 'iaso.forms.error.fieldRequired',
        defaultMessage: 'This field is required',
    },
    projectsError: {
        id: 'iaso.snackBar.fetchProjectsError',
        defaultMessage: 'An error occurred while fetching projects list',
    },
    project: {
        id: 'iaso.datasources.label.project',
        defaultMessage: 'Project',
    },
    description: {
        id: 'iaso.versionsDialog.label.description',
        defaultMessage: 'Description',
    },
    invalidDate: {
        id: 'iaso.label.invalidDate',
        defaultMessage: 'Invalid date',
    },
    deletePlanning: {
        id: 'iaso.label.deletePlanning',
        defaultMessage: 'Delete planning : {planningName}',
    },
    deleteWarning: {
        id: 'iaso.label.deleteWarning',
        defaultMessage: 'Are you sure you want to delete {planningName}?',
    },
    planningAndOrgUnit: {
        id: 'iaso.error.label.planningAndOrgUnit',
        defaultMessage: 'Planning and org unit must be in the same project',
    },
    planningAndForms: {
        id: 'iaso.error.label.planningAndForms',
        defaultMessage: 'Planning and forms must be in the same project',
    },
    planningAndTeams: {
        id: 'iaso.error.label.planningAndTeams',
        defaultMessage: 'Planning and teams must be in the same project',
    },
    planningsError: {
        id: 'iaso.snackBar.fetchProjectsError',
        defaultMessage: 'An error occurred while fetching plannings list',
    },
    EndDateBeforeStartDate: {
        id: 'iaso.error.label.EndDateBeforeStartDate',
        defaultMessage: "End date can't before start date",
    },
    startDateAfterEndDate: {
        id: 'iaso.error.label.startDateAfterEndDate',
        defaultMessage: "Start date can't after end date",
    },
    formSelectHelperText: {
        id: 'iaso.label.formSelectHelperText',
        defaultMessage: 'You must select a project before selecting a form',
    },
    teamSelectHelperText: {
        id: 'iaso.label.teamSelectHelperText',
        defaultMessage: 'You must select a project before selecting a team',
    },
});

export default MESSAGES;
