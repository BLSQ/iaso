import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    queued: {
        defaultMessage: 'QUEUED',
        id: 'iaso.tasks.queued',
    },
    running: {
        defaultMessage: 'RUNNING',
        id: 'iaso.tasks.running',
    },
    errored: {
        defaultMessage: 'ERRORED',
        id: 'iaso.tasks.errored',
    },
    success: {
        defaultMessage: 'SUCCESS',
        id: 'iaso.tasks.success',
    },
    killed: {
        defaultMessage: 'KILLED',
        id: 'iaso.tasks.killed',
    },
    exported: {
        defaultMessage: 'EXPORTED',
        id: 'iaso.tasks.exported',
    },
    skipped: {
        defaultMessage: 'SKIPPED',
        id: 'iaso.tasks.skipped',
    },
    unknown: {
        defaultMessage: 'UNKNOWN',
        id: 'iaso.tasks.unknown',
    },
    timeCreated: {
        defaultMessage: 'Date de création',
        id: 'iaso.tasks.timeCreated',
    },
    timeStart: {
        defaultMessage: 'Date de début',
        id: 'iaso.tasks.timeStart',
    },
    timeEnd: {
        defaultMessage: 'Date de fin',
        id: 'iaso.tasks.timeEnd',
    },
    tasks: {
        defaultMessage: 'Tasks',
        id: 'iaso.label.tasks',
    },
    status: {
        defaultMessage: 'Nom & Status',
        id: 'iaso.tasks.status',
    },
    name: {
        defaultMessage: 'Name',
        id: 'iaso.tasks.name',
    },
    launcher: {
        defaultMessage: 'User',
        id: 'iaso.tasks.launcher',
    },
    progress: {
        defaultMessage: 'Progress',
        id: 'iaso.tasks.progress',
    },
    refresh: {
        defaultMessage: 'Refresh',
        id: 'iaso.label.refresh',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    message: {
        defaultMessage: 'Message',
        id: 'iaso.tasks.message',
    },
    killTask: {
        defaultMessage: 'Arrêter la tâche',
        id: 'iaso.tasks.killTask',
    },
    killSignalSent: {
        defaultMessage: "Signal d'arrêt envoyé",
        id: 'iaso.tasks.killSignalSent',
    },
});

export default MESSAGES;
