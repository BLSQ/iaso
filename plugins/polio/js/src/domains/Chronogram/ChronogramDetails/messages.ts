import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    actions: {
        id: 'iaso.polio.chronogram.details.actions',
        defaultMessage: 'Actions',
    },
    chronogramDetailsTitle: {
        id: 'iaso.polio.chronogram.details.title',
        defaultMessage: `Chronogram for {campaignName} Round {round_number} - Start: {round_start_date}`,
    },
    labelId: {
        id: 'iaso.polio.chronogram.details.label.id',
        defaultMessage: 'ID',
    },
    labelPeriod: {
        id: 'iaso.polio.chronogram.details.label.period',
        defaultMessage: 'Period',
    },
    labelComment: {
        id: 'iaso.polio.chronogram.details.label.label_comment',
        defaultMessage: 'Comment',
    },
    labelDeadlineDate: {
        id: 'iaso.polio.chronogram.details.label.label_deadline_date',
        defaultMessage: 'Deadline',
    },
    labelDelayInDays: {
        id: 'iaso.polio.chronogram.details.label.label_delay_in_days',
        defaultMessage: 'Delay',
    },
    labelDescription: {
        id: 'iaso.polio.chronogram.details.label.description',
        defaultMessage: 'Activity',
    },
    labelStatus: {
        id: 'iaso.polio.chronogram.details.label.status',
        defaultMessage: 'Status',
    },
    labelStartOffsetInDays: {
        id: 'iaso.polio.chronogram.details.label.label_start_offset_in_days',
        defaultMessage: 'Start',
    },
    labelUserInCharge: {
        id: 'iaso.polio.chronogram.details.label.label_user_in_charge',
        defaultMessage: 'Responsible',
    },
    modalDeleteConfirm: {
        id: 'iaso.polio.chronogram.details.modal.delete.confirm',
        defaultMessage: 'Do you really want to delete this task?',
    },
    modalDeleteNo: {
        id: 'iaso.polio.chronogram.details.modal.no',
        defaultMessage: 'No',
    },
    modalDeleteTitle: {
        id: 'iaso.polio.chronogram.details.modal.delete.title',
        defaultMessage: 'Delete Chronogram Task',
    },
    modalDeleteYes: {
        id: 'iaso.polio.chronogram.details.modal.yes',
        defaultMessage: 'Yes',
    },
});

export default MESSAGES;
