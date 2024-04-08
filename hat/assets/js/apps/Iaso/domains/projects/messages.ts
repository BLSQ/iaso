import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    projects: {
        defaultMessage: 'Projects',
        id: 'iaso.label.projects',
    },
    create: {
        defaultMessage: 'Create project',
        id: 'iaso.projects.create',
    },
    projectName: {
        defaultMessage: 'Project name',
        id: 'iaso.projects.name',
    },
    appId: {
        defaultMessage: 'App ID',
        id: 'iaso.projects.appId',
    },
    needsAuthentication: {
        defaultMessage: 'Requires Authentication',
        id: 'iaso.projects.needsAuthentication',
    },
    true: {
        defaultMessage: 'User needs authentication',
        id: 'iaso.projects.true',
    },
    false: {
        defaultMessage: "User doesn't need authentication",
        id: 'iaso.projects.false',
    },
    featureFlags: {
        defaultMessage: 'Feature flags',
        id: 'iaso.label.featureFlags',
    },
    updateProject: {
        defaultMessage: 'Update project',
        id: 'iaso.projects.update',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    edit: {
        defaultMessage: 'Edit',
        id: 'iaso.label.edit',
    },
    infos: {
        defaultMessage: 'Infos',
        id: 'iaso.orgUnits.infos',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    appIdError: {
        id: 'iaso.projets.label.appIdError',
        defaultMessage: '"-" and whitespace are not allowed in app id',
    },
});

export default MESSAGES;
