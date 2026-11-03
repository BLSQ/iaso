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
    addFormLabel: {
        id: 'iaso.missions.label.addFormLabel',
        defaultMessage: 'Add a form',
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
    cardinality: {
        id: 'iaso.missions.label.cardinality',
        defaultMessage: 'Cardinality',
    },
    cardinalityRange: {
        id: 'iaso.missions.label.cardinalityRange',
        defaultMessage: 'min {min} · max {max}',
    },
    minPerOrgUnit: {
        id: 'iaso.missions.label.minPerOrgUnit',
        defaultMessage: 'Min / org unit',
    },
    maxPerOrgUnit: {
        id: 'iaso.missions.label.maxPerOrgUnit',
        defaultMessage: 'Max / org unit',
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
    formsCount: {
        id: 'iaso.missions.label.formsCount',
        defaultMessage: '{count, plural, one {# form} other {# forms}}',
    },
    formsOnAssignedOrgUnitInfo: {
        id: 'iaso.missions.label.formsOnAssignedOrgUnitInfo',
        defaultMessage:
            'Per form, min is the number of submissions required on each assigned org unit, max the number allowed (empty = no limit).',
    },
    orgUnitsAgentCreates: {
        id: 'iaso.missions.label.orgUnitsAgentCreates',
        defaultMessage: 'Org units the agent creates',
    },
    orgUnitsAgentCreatesInfo: {
        id: 'iaso.missions.label.orgUnitsAgentCreatesInfo',
        defaultMessage:
            'In each assigned org unit, the agent creates new org units of this type.',
    },
    orgUnitTypeToCreate: {
        id: 'iaso.missions.label.orgUnitTypeToCreate',
        defaultMessage: 'Org unit type to create',
    },
    minNewOrgUnits: {
        id: 'iaso.missions.label.minNewOrgUnits',
        defaultMessage: 'Min new org units per assigned org unit',
    },
    maxNewOrgUnits: {
        id: 'iaso.missions.label.maxNewOrgUnits',
        defaultMessage: 'Max new org units per assigned org unit',
    },
    formsOnCreatedOrgUnit: {
        id: 'iaso.missions.label.formsOnCreatedOrgUnit',
        defaultMessage: 'Forms submitted on each created org unit',
    },
    formsOnCreatedOrgUnitInfo: {
        id: 'iaso.missions.label.formsOnCreatedOrgUnitInfo',
        defaultMessage:
            'Per form, min is the number of submissions required on each new org unit, max the number allowed (empty = no limit).',
    },
    entitiesAgentCreates: {
        id: 'iaso.missions.label.entitiesAgentCreates',
        defaultMessage: 'Entities the agent creates',
    },
    entitiesAgentCreatesInfo: {
        id: 'iaso.missions.label.entitiesAgentCreatesInfo',
        defaultMessage:
            'In each assigned org unit, the agent registers new entities of this type.',
    },
    entityTypeToCreate: {
        id: 'iaso.missions.label.entityTypeToCreate',
        defaultMessage: 'Entity type to create',
    },
    minEntities: {
        id: 'iaso.missions.label.minEntities',
        defaultMessage: 'Min entities per assigned org unit',
    },
    maxEntities: {
        id: 'iaso.missions.label.maxEntities',
        defaultMessage: 'Max entities per assigned org unit',
    },
    formsOnCreatedEntity: {
        id: 'iaso.missions.label.formsOnCreatedEntity',
        defaultMessage: 'Forms submitted on each created entity',
    },
    formsOnCreatedEntityInfo: {
        id: 'iaso.missions.label.formsOnCreatedEntityInfo',
        defaultMessage:
            'Per form, min is the number of submissions required on each entity, max the number allowed (empty = no limit).',
    },
    minPerEntity: {
        id: 'iaso.missions.label.minPerEntity',
        defaultMessage: 'Min / entity',
    },
    maxPerEntity: {
        id: 'iaso.missions.label.maxPerEntity',
        defaultMessage: 'Max / entity',
    },
    formFillingDescription: {
        id: 'iaso.missions.label.formFillingDescription',
        defaultMessage:
            'Submit forms on the existing org units assigned to the agent.',
    },
    orgUnitAndFormDescription: {
        id: 'iaso.missions.label.orgUnitAndFormDescription',
        defaultMessage:
            'Create new org units in the assigned area, then submit forms on each of them.',
    },
    entityAndFormDescription: {
        id: 'iaso.missions.label.entityAndFormDescription',
        defaultMessage:
            'Register new entities (e.g. beneficiaries) in the assigned area, then submit forms on each of them.',
    },
});

export default MESSAGES;
