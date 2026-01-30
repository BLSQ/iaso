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
        defaultMessage: 'Show all',
        id: 'iaso.label.showAll',
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
    assignments: {
        defaultMessage: 'Assignments',
        id: 'iaso.label.assignments',
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
    create: {
        id: 'iaso.label.create',
        defaultMessage: 'Create',
    },
    selectOrgUnit: {
        id: 'iaso.plannings.label.selectOrgUnit',
        defaultMessage: 'Target geography',
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
        defaultMessage: 'Are you sure you want to delete {name}?',
    },
    delete: {
        id: 'iaso.label.delete',
        defaultMessage: 'Delete',
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
    planningAndTargetOrgUnitType: {
        id: 'iaso.error.label.planningAndTargetOrgUnitType',
        defaultMessage:
            'Planning and target org unit type must be in the same project',
    },
    noOrgUnitsOfTypeInHierarchy: {
        id: 'iaso.error.label.noOrgUnitsOfTypeInHierarchy',
        defaultMessage:
            'No org units of this type exist below the selected org unit',
    },
    planningsError: {
        id: 'iaso.snackBar.fetchPlanningsError',
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
    publishedWithoutStartDate: {
        id: 'iaso.error.label.publishedWithoutStartDate',
        defaultMessage: 'Start date must be set when publishing',
    },
    publishedWithoutEndDate: {
        id: 'iaso.error.label.publishedWithoutEndDate',
        defaultMessage: 'End date must be set when publishing',
    },
    projectSelectHelperText: {
        id: 'iaso.label.projectSelectHelperText',
        defaultMessage: 'You must select a project first',
    },
    orgUnit: {
        id: 'iaso.label.orgUnitSingle',
        defaultMessage: 'Org unit',
    },
    pipelines: {
        id: 'iaso.label.pipelines',
        defaultMessage: 'Pipelines',
    },
    targetOrgUnitType: {
        id: 'iaso.label.targetOrgUnitType',
        defaultMessage: 'Assignments level',
    },
    targetOrgUnitTypeInfos: {
        id: 'iaso.label.targetOrgUnitTypeInfos',
        defaultMessage: 'Select the target geography first',
    },
    status: {
        id: 'iaso.label.status',
        defaultMessage: 'Status',
    },
    samplingResults: {
        id: 'iaso.plannings.label.samplingResults',
        defaultMessage: 'Sampling results',
    },
    orgUnitsCount: {
        id: 'iaso.plannings.label.orgUnitsCount',
        defaultMessage: 'Org units count',
    },
    created_at: {
        id: 'iaso.label.created_at',
        defaultMessage: 'Created',
    },
    seeSamplingResults: {
        id: 'iaso.plannings.label.seeSamplingResults',
        defaultMessage: 'See sampling results',
    },
    samplingName: {
        id: 'iaso.plannings.label.samplingName',
        defaultMessage: 'Sampling name',
    },
    selectSamplingResult: {
        id: 'iaso.plannings.label.selectSamplingResult',
        defaultMessage: 'Select sampling result',
    },
    openHexaIntegration: {
        defaultMessage: 'Sampling',
        id: 'iaso.assignment.openHexaIntegration',
    },
    pipeline: {
        defaultMessage: 'Pipeline',
        id: 'iaso.assignment.pipeline',
    },
    launch: {
        id: 'iaso.label.launch',
        defaultMessage: 'Launch',
    },
    QUEUED: {
        id: 'iaso.tasks.queued',
        defaultMessage: 'QUEUED',
    },
    RUNNING: {
        id: 'iaso.tasks.running',
        defaultMessage: 'RUNNING',
    },
    ERRORED: {
        id: 'iaso.tasks.errored',
        defaultMessage: 'ERRORED',
    },
    EXPORTED: {
        id: 'iaso.tasks.exported',
        defaultMessage: 'EXPORTED',
    },
    SUCCESS: {
        id: 'iaso.tasks.success',
        defaultMessage: 'SUCCESS',
    },
    SKIPPED: {
        id: 'iaso.tasks.skipped',
        defaultMessage: 'SKIPPED',
    },
    KILLED: {
        id: 'iaso.tasks.killed',
        defaultMessage: 'KILLED',
    },
    addLevel: {
        defaultMessage: 'Add level',
        id: 'iaso.openHexalabel.addLevel',
    },
    removeLevel: {
        defaultMessage: 'Remove level',
        id: 'iaso.openHexalabel.removeLevel',
    },
    collapse: {
        defaultMessage: 'Collapse',
        id: 'iaso.openHexalabel.collapse',
    },
    expand: {
        defaultMessage: 'Expand',
        id: 'iaso.openHexalabel.expand',
    },
    noParameters: {
        defaultMessage: 'No parameters',
        id: 'iaso.label.noParameters',
    },
    close: {
        id: 'iaso.label.close',
        defaultMessage: 'Close',
    },
    quantity: {
        defaultMessage: 'Qty',
        id: 'iaso.label.quantityShort',
    },
    level: {
        defaultMessage: 'Level',
        id: 'iaso.forms.level',
    },
    excludedOrgUnits: {
        defaultMessage: 'Excluded org units',
        id: 'iaso.openHexalabel.excludedOrgUnits',
    },
    ruralUrban: {
        defaultMessage: 'Rural/Urban',
        id: 'iaso.openHexalabel.ruralUrban',
    },
    urban: {
        defaultMessage: 'Urban',
        id: 'iaso.openHexalabel.urban',
    },
    rural: {
        defaultMessage: 'Rural',
        id: 'iaso.openHexalabel.rural',
    },
    back: {
        defaultMessage: 'Back',
        id: 'iaso.label.back',
    },
    deleteAssignments: {
        id: 'iaso.assignment.deleteAssignments',
        defaultMessage: 'Delete assignments for planning : {name}',
    },
    deleteAssignmentsWarning: {
        id: 'iaso.assignment.deleteAssignmentsWarning',
        defaultMessage: 'Are you sure you want to delete {count} assignments?',
    },
    deleteAssignmentsInfos: {
        id: 'iaso.assignment.deleteAssignmentsInfos',
        defaultMessage: 'Please delete all assignments first',
    },
    bulkDeleteAssignmentsSuccess: {
        id: 'iaso.assignment.bulkDeleteAssignmentsSuccess',
        defaultMessage: 'Assignments deleted successfully',
    },
    emptyAssignments: {
        id: 'iaso.assignment.emptyAssignments',
        defaultMessage: 'Delete assignments',
    },
    progress: {
        defaultMessage: 'Progress',
        id: 'iaso.tasks.progress',
    },
});

export default MESSAGES;
