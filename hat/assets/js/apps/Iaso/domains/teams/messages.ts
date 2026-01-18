import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    title: {
        defaultMessage: 'Teams',
        id: 'iaso.teams.title',
    },
    search: {
        defaultMessage: 'Search',
        id: 'iaso.search',
    },
    name: {
        defaultMessage: 'Name',
        id: 'iaso.label.name',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    requiredField: {
        id: 'iaso.forms.error.fieldRequired',
        defaultMessage: 'This field is required',
    },
    editTeam: {
        id: 'iaso.teams.edit',
        defaultMessage: 'Edit team',
    },
    createTeam: {
        id: 'iaso.teams.create',
        defaultMessage: 'Create team',
    },
    edit: {
        id: 'iaso.label.edit',
        defaultMessage: 'Edit',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    description: {
        id: 'iaso.versionsDialog.label.description',
        defaultMessage: 'Description',
    },
    projectsError: {
        id: 'iaso.snackBar.fetchProjectsError',
        defaultMessage: 'An error occurred while fetching projects list',
    },
    project: {
        id: 'iaso.datasources.label.project',
        defaultMessage: 'Project',
    },
    manager: {
        id: 'iaso.teams.manager',
        defaultMessage: 'Manager',
    },
    type: {
        id: 'iaso.label.type',
        defaultMessage: 'Type',
    },
    teamsOfTeams: {
        id: 'iaso.teams.teamsOfTeams',
        defaultMessage: 'Teams of teams',
    },
    teamsOfUsers: {
        id: 'iaso.teams.teamsOfUsers',
        defaultMessage: 'Teams of users',
    },
    users: {
        id: 'iaso.teams.users',
        defaultMessage: 'Users',
    },
    usersTeams: {
        id: 'iaso.teams.usersTeams',
        defaultMessage: 'Users / teams',
    },
    delete: {
        id: 'iaso.teams.delete',
        defaultMessage: 'Are you sure you want to delete this team?',
    },
    deleteError: {
        id: 'iaso.snackBar.deleteTeamError',
        defaultMessage: 'An error occurred while deleting team',
    },
    deleteSuccess: {
        id: 'iaso.snackBar.delete_successful',
        defaultMessage: 'Deleted successfully',
    },
    teamDeleted: {
        id: 'iaso.teams.teamDeleted',
        defaultMessage: 'Team deleted',
    },
    noLoopInSubTree: {
        id: 'iaso.teams.noLoopInSubTree',
        defaultMessage: 'Cannot create loop in teams tree',
    },
    parentIsNotTeamOfTeam: {
        id: 'iaso.teams.parentIsNotTeamOfTeam',
        defaultMessage: 'Parent is not team of teams',
    },
    parentTeam: {
        id: 'iaso.teams.parentTeam',
        defaultMessage: 'Parent team',
    },
    color: {
        id: 'iaso.label.color',
        defaultMessage: 'Color',
    },
});

export default MESSAGES;
