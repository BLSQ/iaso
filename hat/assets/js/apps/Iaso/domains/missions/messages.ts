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
    missionType: {
        defaultMessage: 'Mission type',
        id: 'iaso.missions.label.missionType',
    },
    forms: {
        defaultMessage: 'Forms',
        id: 'iaso.forms.title',
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
    FORM_FILLING: {
        defaultMessage: 'Form Filling',
        id: 'iaso.missions.type.formFilling',
    },
    ORG_UNIT_AND_FORM: {
        defaultMessage: 'Org Unit and Form',
        id: 'iaso.missions.type.orgUnitAndForm',
    },
    ENTITY_AND_FORM: {
        defaultMessage: 'Entity and Form',
        id: 'iaso.missions.type.entityAndForm',
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
        defaultMessage: 'Add a form',
    },
    min: {
        id: 'iaso.missions.label.min',
        defaultMessage: 'Min',
    },
    max: {
        id: 'iaso.missions.label.max',
        defaultMessage: 'Max',
    },
});

export default MESSAGES;
