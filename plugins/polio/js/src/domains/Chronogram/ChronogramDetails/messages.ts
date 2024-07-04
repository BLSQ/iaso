import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    actions: {
        id: 'iaso.label.actions',
        defaultMessage: 'Actions',
    },
    no: {
        id: 'iaso.label.no',
        defaultMessage: 'No',
    },
    yes: {
        id: 'iaso.label.yes',
        defaultMessage: 'Yes',
    },
    chronogramDetailsTitle: {
        id: 'iaso.polio.chronogram.details.title',
        defaultMessage: `Chronogram for {campaignName} Round {round_number} - Start: {round_start_date}`,
    },
    labelId: {
        id: 'iaso.label.id',
        defaultMessage: 'ID',
    },
    labelComment: {
        id: 'iaso.polio.chronogram.label.label_comment',
        defaultMessage: 'Comment',
    },
    labelDeadlineDate: {
        id: 'iaso.polio.chronogram.label.label_deadline_date',
        defaultMessage: 'Deadline',
    },
    labelDelayInDays: {
        id: 'iaso.polio.chronogram.label.label_delay_in_days',
        defaultMessage: 'Delay',
    },
    labelDescription: {
        id: 'iaso.polio.chronogram.label.description',
        defaultMessage: 'Activity',
    },
    labelPeriod: {
        id: 'iaso.polio.chronogram.label.period',
        defaultMessage: 'Period',
    },
    labelStartOffsetInDays: {
        id: 'iaso.polio.chronogram.label.label_start_offset_in_days',
        defaultMessage: 'Start',
    },
    labelStatus: {
        id: 'iaso.polio.chronogram.label.status',
        defaultMessage: 'Status',
    },
    labelUserInCharge: {
        id: 'iaso.polio.chronogram.label.label_user_in_charge',
        defaultMessage: 'Responsible',
    },
    modalDeleteConfirm: {
        id: 'iaso.polio.chronogram.details.modal.delete.confirm',
        defaultMessage: 'Do you really want to delete this task?',
    },
    modalDeleteTitle: {
        id: 'iaso.polio.chronogram.details.modal.delete.title',
        defaultMessage: 'Delete Chronogram Task',
    },
});

export default MESSAGES;
