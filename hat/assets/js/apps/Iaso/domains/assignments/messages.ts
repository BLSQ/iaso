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
        defaultMessage: 'Select by parent type',
    },
    name: {
        defaultMessage: 'Name',
        id: 'iaso.label.name',
    },
    assignationsCount: {
        defaultMessage: 'Assignments count',
        id: 'iaso.assignment.count',
    },
    assignment: {
        defaultMessage: 'Assignment',
        id: 'iaso.assignment.label',
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
        defaultMessage: 'Already assigned to',
        id: 'iaso.assignment.alreadyAssignedTo',
    },
    alreadyAssigned: {
        defaultMessage: 'Already assigned',
        id: 'iaso.assignment.alreadyAssigned',
    },
    inAnotherTeam: {
        defaultMessage: 'in another team',
        id: 'iaso.assignment.inAnotherTeam',
    },
    parentDialogTitle: {
        defaultMessage: 'Assign {assignmentCount} to {parentOrgUnitName}',
        id: 'iaso.assignment.parentDialog.title',
    },
    parentDialogTitleUnsassign: {
        defaultMessage: 'Unassign {assignmentCount} from {parentOrgUnitName}',
        id: 'iaso.assignment.parentDialog.titleUnsassign',
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
    orgUnits: {
        id: 'iaso.label.orgUnit',
        defaultMessage: 'Org units',
    },
    orgUnitsParent: {
        id: 'iaso.label.orgUnitParent',
        defaultMessage: 'Parent {index}',
    },
    clickRowToUnAssign: {
        id: 'iaso.assignment.clickRowToUnAssign',
        defaultMessage: 'Click on the row to unassign',
    },
    details: {
        defaultMessage: 'Details',
        id: 'iaso.label.details',
    },
    orgUnitType: {
        defaultMessage: 'Org unit type',
        id: 'iaso.forms.org_unit_type_id',
    },
    parents: {
        defaultMessage: 'Parents',
        id: 'iaso.orgUnits.parents',
    },
    mapHelper: {
        defaultMessage:
            'Right click on a org unit to see details popup, normal click to close popup',
        id: 'iaso.assignment.mapHelper',
    },
    apply: {
        defaultMessage: 'Apply',
        id: 'iaso.label.apply',
    },
    searchOrgUnit: {
        defaultMessage: 'Search an org unit',
        id: 'iaso.assignment.searchOrgUnit',
    },
});

export default MESSAGES;
