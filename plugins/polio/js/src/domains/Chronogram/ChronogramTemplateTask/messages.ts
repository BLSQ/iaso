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
    chronogramTemplateTaskTitle: {
        id: 'iaso.polio.chronogram.template_task_title',
        defaultMessage: 'Default Chronogram Tasks',
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
    labelId: {
        id: 'iaso.label.id',
        defaultMessage: 'Identifier',
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
    modalAddTitle: {
        id: 'iaso.polio.chronogram.template_task.modal.add_title',
        defaultMessage: 'Add Default Chronogram Task',
    },
    modalDeleteConfirm: {
        id: 'iaso.polio.chronogram.template_task.modal.delete_confirm',
        defaultMessage: 'Do you really want to delete this default task?',
    },
    modalDeleteTitle: {
        id: 'iaso.polio.chronogram.template_task.modal.delete_title',
        defaultMessage: 'Delete Default Chronogram Task',
    },
    modalEditTitle: {
        id: 'iaso.polio.chronogram.template_task.modal.edit_title',
        defaultMessage: 'Edit Default Chronogram Task',
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
