import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    title: {
        defaultMessage: 'Assignments for planning',
        id: 'iaso.assignment.title',
    },
    team: {
        defaultMessage: 'Team',
        id: 'iaso.label.team',
    },
    map: {
        defaultMessage: 'Map',
        id: 'iaso.label.map',
    },
    list: {
        defaultMessage: 'List',
        id: 'iaso.label.list',
    },
    baseOrgUnitsType: {
        id: 'iaso.assignment.baseOrgUnitsType',
        defaultMessage: 'Base organisation unit type',
    },
    parentOrgunitType: {
        id: 'iaso.assignment.parentOrgUnitsType',
        defaultMessage: 'Parent organisation unit type',
    },
    parentPicking: {
        id: 'iaso.assignment.parentPicking',
        defaultMessage: 'Parent picking mode',
    },
    name: {
        defaultMessage: 'Name',
        id: 'iaso.label.name',
    },
    assignationsCount: {
        defaultMessage: 'Assignments count',
        id: 'iaso.assignment.count',
    },
    color: {
        defaultMessage: 'Color',
        id: 'iaso.label.color',
    },
    selection: {
        defaultMessage: 'Selection',
        id: 'iaso.label.selection',
    },
    alreadyAssignedTo: {
        defaultMessage: 'already assigned to',
        id: 'iaso.assignment.alreadyAssignedTo',
    },
    inAnotherTeam: {
        defaultMessage: 'in another team',
        id: 'iaso.assignment.inAnotherTeam',
    },
    parentDialogTitle: {
        defaultMessage: 'Assign {assignmentCount} to {parentOrgUnitName}',
        id: 'iaso.assignment.parentDialog.title',
    },
    confirm: {
        id: 'iaso.label.confirm',
        defaultMessage: 'Confirm',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    status: {
        id: 'iaso.forms.status',
        defaultMessage: 'Status',
    },
});

export default MESSAGES;
