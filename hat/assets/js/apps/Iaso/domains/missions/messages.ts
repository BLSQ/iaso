import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    title: {
        defaultMessage: 'Missions',
        id: 'iaso.missions.title',
    },
    search: {
        defaultMessage: 'Search',
        id: 'iaso.search',
    },
    name: {
        defaultMessage: 'Name',
        id: 'iaso.label.name',
    },
    description: {
        defaultMessage: 'Description',
        id: 'iaso.projects.description',
    },
    missionType: {
        defaultMessage: 'Mission type',
        id: 'iaso.missions.label.missionType',
    },
    forms: {
        defaultMessage: 'Forms',
        id: 'iaso.forms.title',
    },
    form: {
        defaultMessage: 'Form',
        id: 'iaso.form.title',
    },
    noResultsFound: {
        defaultMessage: 'No results found.',
        id: 'iaso.missions.noResultsFound',
    },
    formsNumber: {
        defaultMessage: 'Number of forms',
        id: 'iaso.formsNumber.title',
    },
    generalInfoTitle: {
        defaultMessage: 'Information',
        id: 'iaso.missions.title.generalInfoTitle',
    },
    alertSelectMissionType: {
        defaultMessage: 'Please select a mission type',
        id: 'iaso.missions.alert.selectMissionType',
    },
    orgUnitType: {
        defaultMessage: 'Org unit type',
        id: 'iaso.missions.label.orgUnitType',
    },
    entityType: {
        defaultMessage: 'Entity type',
        id: 'iaso.missions.label.entityType',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    create: {
        id: 'iaso.label.create',
        defaultMessage: 'Create',
    },
    deleteMission: {
        id: 'iaso.missions.label.deleteMission',
        defaultMessage: 'Delete mission: {missionName}',
    },
    deleteWarning: {
        id: 'iaso.label.deleteWarning',
        defaultMessage: 'Are you sure you want to delete {name}?',
    },
    created_at: {
        id: 'iaso.label.created_at',
        defaultMessage: 'Created',
    },
    createMission: {
        id: 'iaso.missions.label.createMission',
        defaultMessage: 'Create mission',
    },
    editMission: {
        id: 'iaso.missions.label.editMission',
        defaultMessage: 'Edit mission',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    minCardinality: {
        id: 'iaso.missions.label.minCardinality',
        defaultMessage: 'Min cardinality',
    },
    maxCardinality: {
        id: 'iaso.missions.label.maxCardinality',
        defaultMessage: 'Max cardinality',
    },
    addForm: {
        id: 'iaso.missions.label.addForm',
        defaultMessage: 'Select a form to add...',
    },
    min: {
        id: 'iaso.missions.label.min',
        defaultMessage: 'Min',
    },
    max: {
        id: 'iaso.missions.label.max',
        defaultMessage: 'Max',
    },
    detailMissionLabel: {
        id: 'iaso.missions.label.detailMissionLabel',
        defaultMessage: 'Mission details',
    },
    view: {
        defaultMessage: 'View',
        id: 'iaso.label.view',
    },
    edit: {
        defaultMessage: 'Edit',
        id: 'iaso.label.edit',
    },
    missionDetailTitle: {
        defaultMessage: 'Mission details',
        id: 'iaso.missions.title.missionDetail',
    },
    infinity: {
        defaultMessage: 'Infinity',
        id: 'iaso.missions.infinity',
    },
    delete: {
        defaultMessage: 'Delete',
        id: 'iaso.missions.delete',
    },
    pleaseSelectOrgUnitType: {
        defaultMessage: 'Please select an org unit type',
        id: 'iaso.missions.selectOuType',
    },
    pleaseSelectEntityType: {
        defaultMessage: 'Please select an entity type',
        id: 'iaso.missions.selectEntityType',
    },
    missions: {
        defaultMessage: 'Missions',
        id: 'iaso.missions.label.missions',
    },
    newMission: {
        id: 'iaso.missions.label.newMission',
        defaultMessage: 'New mission',
    },
    orgUnitAndFormChip: {
        id: 'iaso.missions.chip.orgUnitAndForm',
        defaultMessage: 'Org unit + Form',
    },
    entityAndFormChip: {
        id: 'iaso.missions.chip.entityAndForm',
        defaultMessage: 'Entity + Form',
    },
    formInfo: {
        id: 'iaso.missions.label.formInfo',
        defaultMessage:
            'Add one or more forms. Per form, set how many submissions each assigned unit must collect — min required, max allowed (leave max empty for no limit / ∞).',
    },
});

export default MESSAGES;
