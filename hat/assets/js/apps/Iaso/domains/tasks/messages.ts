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
    task: {
        defaultMessage: 'Task',
        id: 'iaso.label.task',
    },
    tasks: {
        defaultMessage: 'Tasks',
        id: 'iaso.label.tasks',
    },
    status: {
        defaultMessage: 'Status',
        id: 'iaso.tasks.status',
    },
    name: {
        defaultMessage: 'Name',
        id: 'iaso.tasks.name',
    },
    user: {
        defaultMessage: 'User',
        id: 'iaso.tasks.user',
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
        defaultMessage: `Signal d'arrêt envoyé`,
        id: 'iaso.tasks.killSignalSent',
    },
    patchTaskError: {
        defaultMessage: 'An error occurred while updating the task',
        id: 'iaso.snackBar.patchTaskError',
    },
    patchTaskSuccess: {
        defaultMessage: 'The task has been updated.',
        id: 'iaso.snackBar.patchTaskSuccess',
    },
    fetchTasksError: {
        defaultMessage: 'An error occurred while fetching tasks list',
        id: 'iaso.snackBar.fetchTasksError',
    },
    relaunch: {
        defaultMessage: 'Relaunch the task',
        id: 'iaso.tasks.relaunch',
    },
    last_launched_by: {
        defaultMessage: 'Last launch:',
        id: 'iaso.tasks.last_launch_by',
    },
    dateFrom: {
        defaultMessage: 'Start date',
        id: 'iaso.label.dateFrom',
    },
    dateTo: {
        defaultMessage: 'End date',
        id: 'iaso.label.dateTo',
    },
    taskType: {
        defaultMessage: 'Type',
        id: 'iaso.tasks.type',
    },
    noLogsToShow: {
        defaultMessage: 'No logs to show.',
        id: 'iaso.tasks.no_logs_to_show',
    },
    logs: {
        defaultMessage: 'Logs',
        id: 'iaso.storages.logs',
    },
    download: {
        defaultMessage: 'Download',
        id: 'iaso.label.download',
    },
    fileAvailableUntil: {
        defaultMessage: 'File available until',
        id: 'iaso.tasks.fileAvailableUntil',
    },
    fileExpired: {
        defaultMessage: 'Expired on {date}',
        id: 'iaso.tasks.fileExpired',
    },
    params: {
        defaultMessage: 'Parameters',
        id: 'iaso.label.parameters',
    },
    result_message: {
        defaultMessage: 'Result Message',
        id: 'iaso.label.result_message',
    },
    createdBy: {
        defaultMessage: 'Created by',
        id: 'iaso.tasks.createdBy',
    },
    relaunchedBy: {
        defaultMessage: 'Relaunched by {user}',
        id: 'iaso.tasks.relaunchedBy',
    },
    duration: {
        defaultMessage: 'Duration',
        id: 'iaso.tasks.duration',
    },
    runningFor: {
        defaultMessage: 'Running for',
        id: 'iaso.tasks.runningFor',
    },
    stepCreated: {
        defaultMessage: 'Created',
        id: 'iaso.tasks.stepCreated',
    },
    stepStarted: {
        defaultMessage: 'Started',
        id: 'iaso.tasks.stepStarted',
    },
    stepFailed: {
        defaultMessage: 'Failed',
        id: 'iaso.tasks.stepFailed',
    },
    stepStopped: {
        defaultMessage: 'Stopped',
        id: 'iaso.tasks.stepStopped',
    },
    stopRequested: {
        defaultMessage: 'Stop requested',
        id: 'iaso.tasks.stopRequested',
    },
    external: {
        defaultMessage: 'External',
        id: 'iaso.tasks.external',
    },
    workerLastSeen: {
        defaultMessage: 'Worker last seen {time}',
        id: 'iaso.tasks.workerLastSeen',
    },
    waitingForWorker: {
        defaultMessage: 'Waiting for a worker',
        id: 'iaso.tasks.waitingForWorker',
    },
    inProgress: {
        defaultMessage: 'In progress',
        id: 'iaso.tasks.inProgress',
    },
    succeeded: {
        defaultMessage: 'Completed',
        id: 'iaso.tasks.succeeded',
    },
    failed: {
        defaultMessage: 'Failed',
        id: 'iaso.tasks.failed',
    },
    fileAvailableUntilDate: {
        defaultMessage: 'Available until {date} ({relative})',
        id: 'iaso.tasks.fileAvailableUntilDate',
    },
    stop: {
        defaultMessage: 'Stop',
        id: 'iaso.tasks.stop',
    },
    relaunchShort: {
        defaultMessage: 'Relaunch',
        id: 'iaso.tasks.relaunchShort',
    },
    logsCount: {
        defaultMessage: '{count, plural, one {# entry} other {# entries}}',
        id: 'iaso.tasks.logsCount',
    },
    stepStart: {
        defaultMessage: 'Start',
        id: 'iaso.tasks.stepStart',
    },
    stopTaskTitle: {
        defaultMessage: 'Stop {name}?',
        id: 'iaso.tasks.stopTaskTitle',
    },
    stopTaskWarning: {
        defaultMessage:
            'The task stops at its next progress update. This cannot be undone.',
        id: 'iaso.tasks.stopTaskWarning',
    },
    stopTaskConfirm: {
        defaultMessage: 'Stop task',
        id: 'iaso.tasks.stopTaskConfirm',
    },
    queuedHint: {
        defaultMessage:
            'The task starts automatically when a worker is free. You can close this window.',
        id: 'iaso.tasks.queuedHint',
    },
    logsNotStarted: {
        defaultMessage:
            'No logs yet. They appear here as soon as the task starts.',
        id: 'iaso.tasks.logsNotStarted',
    },
    stepRunning: {
        defaultMessage: 'Running',
        id: 'iaso.tasks.stepRunning',
    },
    cancel: {
        defaultMessage: 'Cancel',
        id: 'iaso.label.cancel',
    },
});

export default MESSAGES;
