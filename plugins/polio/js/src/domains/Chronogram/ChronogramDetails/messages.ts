import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    actions: {
        id: 'iaso.label.actions',
        defaultMessage: 'Action(s)',
    },
    no: {
        id: 'iaso.label.no',
        defaultMessage: 'No',
    },
    yes: {
        id: 'iaso.label.yes',
        defaultMessage: 'Yes',
    },
    updatedAt: {
        id: 'iaso.label.updated_at',
        defaultMessage: 'Updated',
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
        id: 'iaso.polio.chronogram.label.comment',
        defaultMessage: 'Comment',
    },
    labelDeadlineDate: {
        id: 'iaso.polio.chronogram.label.deadline_date',
        defaultMessage: 'Deadline',
    },
    labelDelayInDays: {
        id: 'iaso.polio.chronogram.label.delay_in_days',
        defaultMessage: 'Delay',
    },
    labelDescription: {
        id: 'iaso.polio.chronogram.label.description',
        defaultMessage: 'Activity',
    },
    labelDescriptionEn: {
        id: 'iaso.polio.chronogram.label.description_en',
        defaultMessage: 'Activity (in English)',
    },
    labelDescriptionFr: {
        id: 'iaso.polio.chronogram.label.description_fr',
        defaultMessage: 'Activity (in French)',
    },
    labelPeriod: {
        id: 'iaso.polio.chronogram.label.period',
        defaultMessage: 'Period',
    },
    labelStartOffsetInDays: {
        id: 'iaso.polio.chronogram.label.start_offset_in_days',
        defaultMessage: 'Chrono',
    },
    labelStartOffsetInDaysTooltip: {
        id: 'iaso.polio.chronogram.label.start_offset_in_days_tooltip',
        defaultMessage:
            'Enter as an integer the number of days the task is expected to be completed in regards to Round start date. For tasks to be handled before the round starts, add a minus sign before the integer. E.g. "-7"',
    },
    labelStatus: {
        id: 'iaso.polio.chronogram.label.status',
        defaultMessage: 'Status',
    },
    labelUserInCharge: {
        id: 'iaso.polio.chronogram.label.user_in_charge',
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
    modalAddTitle: {
        id: 'iaso.polio.chronogram.details.modal.add_title',
        defaultMessage: 'Add Chronogram Task',
    },
    modalEditTitle: {
        id: 'iaso.polio.chronogram.details.modal.edit_title',
        defaultMessage: 'Edit Chronogram Task',
    },
    modalWriteCancel: {
        id: 'iaso.polio.chronogram.modal.write.cancel',
        defaultMessage: 'Cancel',
    },
    modalWriteConfirm: {
        id: 'iaso.polio.chronogram.modal.write.confirm',
        defaultMessage: 'Confirm',
    },
    validationFieldRequired: {
        id: 'iaso.polio.chronogram.validation.field_required',
        defaultMessage: 'This field is required',
    },
});

export default MESSAGES;
