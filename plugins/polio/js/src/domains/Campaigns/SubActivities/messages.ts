import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    round: {
        id: 'iaso.polio.label.round',
        defaultMessage: 'Round',
    },
    Months: {
        id: 'iaso.polio.label.months',
        defaultMessage: 'Months',
    },
    Years: {
        id: 'iaso.polio.label.years',
        defaultMessage: 'Years',
    },
    m: {
        id: 'iaso.polio.label.months',
        defaultMessage: 'Months',
    },
    y: {
        id: 'iaso.polio.label.years',
        defaultMessage: 'Years',
    },
    name: {
        defaultMessage: 'Name',
        id: 'iaso.label.name',
    },
    startDate: {
        id: 'iaso.label.dateFrom',
        defaultMessage: 'Start date',
    },
    endDate: {
        id: 'iaso.label.dateTo',
        defaultMessage: 'End date',
    },
    ageGroup: {
        id: 'iaso.polio.label.ageGroup',
        defaultMessage: 'Age group',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    ageMax: {
        defaultMessage: 'Age max',
        id: 'iaso.polio.label.ageMax',
    },
    ageMin: {
        defaultMessage: 'Age min',
        id: 'iaso.polio.label.ageMin',
    },
    ageUnit: {
        defaultMessage: 'Enter age in',
        id: 'iaso.polio.label.ageUnit',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    confirm: {
        defaultMessage: 'Confirm',
        id: 'iaso.label.confirm',
    },
    createSubActivity: {
        defaultMessage: 'Create sub-activity',
        id: 'iaso.polio.label.createSubActivity',
    },
    editSubActivity: {
        defaultMessage: 'Edit sub-activity',
        id: 'iaso.polio.label.editSubActivity',
    },
    deleteSubActivity: {
        defaultMessage: 'Delete sub-activity?',
        id: 'iaso.polio.label.deleteSubActivity',
    },
    fieldRequired: {
        id: 'iaso.polio.form.fieldRequired',
        defaultMessage: 'This field is required',
    },
    invalidDate: {
        id: 'iaso.polio.form.invalidDate',
        defaultMessage: 'Date is invalid',
    },
    endDateBeforeStartDate: {
        id: 'iaso.polio.form.validator.error.endDateBeforeStartDate',
        defaultMessage: "End date can't be before start date",
    },
    startDateAfterEndDate: {
        id: 'iaso.polio.form.validator.error.startDateAfterEndDate',
        defaultMessage: "Start date can't be after end date",
    },
    startDateBeforeRoundDate: {
        id: 'iaso.polio.form.validator.error.startDateBeforeRoundDate',
        defaultMessage: "Start date can't be before round start date",
    },
    endDateAfterRoundDate: {
        id: 'iaso.polio.form.validator.error.endDateAfterRoundDate',
        defaultMessage: "End date can't be after round end date",
    },
    endDateBeforeRoundStart: {
        id: 'iaso.polio.form.validator.error.endDateBeforeRoundStart',
        defaultMessage: "End date can't be before round start date",
    },
    startDateAfterRoundEnd: {
        id: 'iaso.polio.form.validator.error.startDateAfterRoundEnd',
        defaultMessage: "Start date can't be after round end date",
    },
    im_started_at: {
        id: 'iaso.polio.form.label.imStart',
        defaultMessage: 'IM Start',
    },
    im_ended_at: {
        id: 'iaso.polio.form.label.imEnd',
        defaultMessage: 'IM End',
    },
    lqas_started_at: {
        id: 'iaso.polio.form.label.lqasStart',
        defaultMessage: 'LQAS Start',
    },
    lqas_ended_at: {
        id: 'iaso.polio.form.label.lqasEnd',
        defaultMessage: 'LQAS End',
    },
    mustBeAfterSubActivityEndDate: {
        id: 'iaso.polio.form.label.mustBeAfterSubActivityEndDate',
        defaultMessage: 'Must be after sub-activity end date',
    },
    mustBeAfterRoundStartDate: {
        id: 'iaso.polio.form.label.mustBeAfterRoundStartDate',
        defaultMessage: 'Must be after round start date',
    },
});

export default MESSAGES;
