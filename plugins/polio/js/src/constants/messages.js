import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    formsTitle: {
        defaultMessage: 'Forms',
        id: 'iaso.forms.title',
    },
    list: {
        defaultMessage: 'List',
        id: 'iaso.label.list',
    },
    dhis2Mappings: {
        defaultMessage: 'DHIS mappings',
        id: 'iaso.label.dhis2Mappings',
    },
    completeness: {
        defaultMessage: 'Completeness',
        id: 'iaso.completeness.title',
    },
    archived: {
        defaultMessage: 'Archived',
        id: 'iaso.archived.title',
    },
    orgUnitsTitle: {
        defaultMessage: 'Org units',
        id: 'iaso.orgUnits.title',
    },
    groups: {
        defaultMessage: 'Groups',
        id: 'iaso.label.groups',
    },
    orgUnitType: {
        id: 'iaso.orgUnits.orgUnitsTypes',
        defaultMessage: 'Organisation unit type',
    },
    dataSources: {
        id: 'iaso.orgUnits.dataSources',
        defaultMessage: 'Data Sources',
    },
    matching: {
        defaultMessage: 'Matching',
        id: 'iaso.matching.title',
    },
    algorithmsRuns: {
        defaultMessage: 'Algorithms runs',
        id: 'iaso.label.algorithmsRuns',
    },
    config: {
        defaultMessage: 'Admin',
        id: 'iaso.label.config',
    },
    users: {
        defaultMessage: 'Users',
        id: 'iaso.label.users',
    },
    projects: {
        defaultMessage: 'Projects',
        id: 'iaso.label.projects',
    },
    tasks: {
        defaultMessage: 'Tasks',
        id: 'iaso.label.tasks',
    },
    monitoring: {
        defaultMessage: 'Monitoring',
        id: 'iaso.label.monitoring',
    },
    dashboard: {
        defaultMessage: 'Dashboard',
        id: 'iaso.label.dashboard',
    },
    campaigns: {
        defaultMessage: 'Campaigns',
        id: 'iaso.label.campaigns',
    },
    polio: {
        defaultMessage: 'Polio',
        id: 'iaso.label.polio',
    },
    delete: {
        id: 'iaso.label.delete',
        defaultMessage: 'Delete',
    },
    edit: {
        id: 'iaso.label.edit',
        defaultMessage: 'Edit',
    },
    pages: {
        defaultMessage: 'Pages',
        id: 'iaso.label.pages',
    },
    removeDistrict: {
        defaultMessage: 'Unselect district',
        id: 'iaso.button.label.removeDistrict',
    },
    removeRegion: {
        defaultMessage: 'Unselect region',
        id: 'iaso.button.label.removeRegion',
    },
    confirm: {
        defaultMessage: 'Confirm',
        id: 'iaso.label.confirm',
    },
    cancel: {
        defaultMessage: 'Cancel',
        id: 'iaso.label.cancel',
    },
    configuration: {
        defaultMessage: 'Configuration',
        id: 'iaso.polio.label.configuration',
    },
    configEmailNotif: {
        defaultMessage: 'Configure country: {country}',
        id: 'iaso.polio.label.configEmailNotif',
    },
    selectUsers: {
        id: 'iaso.polio.select.label.selectUsers',
        defaultMessage: 'Select users',
    },
    selectLanguage: {
        id: 'iaso.polio.select.label.selectLanguage',
        defaultMessage: 'Select language',
    },
    country: {
        id: 'iaso.polio.table.label.country',
        defaultMessage: 'Country',
    },
    usersToNotify: {
        id: 'iaso.polio.table.label.usersToNotify',
        defaultMessage: 'Users to notify',
    },
    language: {
        id: 'iaso.polio.table.label.language',
        defaultMessage: 'Language',
    },
    actions: {
        id: 'iaso.polio.table.label.actions',
        defaultMessage: 'Actions',
    },
    calendar: {
        id: 'iaso.polio.calendar',
        defaultMessage: 'Calendar',
    },
    weeks: {
        id: 'iaso.polio.calendar.weeks',
        defaultMessage: 'week(s) were',
    },
    startDate: {
        id: 'iaso.label.dateFrom',
        defaultMessage: 'Start date',
    },
    endDate: {
        id: 'iaso.label.dateTo',
        defaultMessage: 'End date',
    },
    name: {
        id: 'iaso.polio.calendar.obrName',
        defaultMessage: 'Name',
    },
    r1StartDate: {
        id: 'iaso.polio.calendar.r1StartDate',
        defaultMessage: 'R1 date',
    },
    raStatus: {
        id: 'iaso.polio.raStatus',
        defaultMessage: 'R1 date',
    },
    budgetStatus: {
        id: 'iaso.polio.budgetStatus',
        defaultMessage: 'Budget status',
    },
    vaccine: {
        id: 'iaso.polio.vaccine',
        defaultMessage: 'Vaccine',
    },
    vaccines: {
        id: 'iaso.polio.vaccines',
        defaultMessage: 'Vaccines',
    },
    endDateBeforeStartDate: {
        id: 'iaso.polio.form.validator.error.endDateBeforeStartDate',
        defaultMessage: "End date can't be before start date",
    },
    positiveInteger: {
        id: 'iaso.polio.form.validator.error.positiveInteger',
        defaultMessage: 'Please use a positive integer',
    },
    district: {
        id: 'iaso.polio.district',
        defaultMessage: 'District',
    },
    noCampaign: {
        id: 'iaso.polio.noCampaign',
        defaultMessage: 'No campaign to display',
    },
});

export default MESSAGES;
