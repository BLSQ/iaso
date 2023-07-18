/* eslint-disable camelcase */
import * as yup from 'yup';
import moment from 'moment';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../constants/messages';
import { dateFormat } from '../components/campaignCalendar/constants';

const getRounds = context => {
    return context?.from[context.from.length - 1]?.value?.rounds || [];
};

yup.addMethod(
    yup.date,
    'isValidRoundStartDate',
    function isValidRoundStartDate(formatMessage) {
        return this.test('isValidRoundStartDate', '', (value, context) => {
            const rounds = getRounds(context);
            const { path, createError, parent } = context;
            const newStartDate = moment(value);
            const endDate =
                parent.ended_at && moment(parent.ended_at, dateFormat);
            const previousNumber = parent.number - 1;

            let errorMessage;

            if (endDate?.isSameOrBefore(newStartDate)) {
                errorMessage = formatMessage(MESSAGES.startDateAfterEndDate);
            } else if (previousNumber >= 0) {
                const previousRound = rounds.find(
                    r => r.number === previousNumber,
                );
                if (previousRound) {
                    const previousEndDate = moment(
                        previousRound.ended_at,
                        dateFormat,
                    );
                    if (previousEndDate?.isSameOrAfter(newStartDate)) {
                        errorMessage = formatMessage(
                            MESSAGES.startDateBeforePreviousEndDate,
                        );
                    }
                }
            }
            if (errorMessage) {
                return createError({
                    path,
                    message: errorMessage,
                });
            }
            return true;
        });
    },
);
yup.addMethod(
    yup.date,
    'isValidRoundEndDate',
    function isValidRoundEndDate(formatMessage) {
        return this.test('isValidRoundEndDate', '', (value, context) => {
            const rounds = getRounds(context);
            const { path, createError, parent } = context;
            const newEndDate = moment(value);
            const nextNumber = parent.number + 1;
            const startDate =
                parent.started_at && moment(parent.started_at, dateFormat);

            let errorMessage;

            if (startDate?.isSameOrAfter(newEndDate)) {
                errorMessage = formatMessage(MESSAGES.endDateBeforeStartDate);
            } else if (newEndDate.isValid() && nextNumber >= 0) {
                const nextRound = rounds.find(r => r.number === nextNumber);
                if (nextRound) {
                    const nextEndDate = moment(nextRound.ended_at, dateFormat);
                    if (nextEndDate?.isSameOrBefore(newEndDate)) {
                        errorMessage = formatMessage(
                            MESSAGES.endDateAfterNextStartDate,
                        );
                    }
                }
            }
            if (errorMessage) {
                return createError({
                    path,
                    message: errorMessage,
                });
            }
            return true;
        });
    },
);

yup.addMethod(yup.date, 'isValidOnset', function isValidOnset(formatMessage) {
    return this.test('insValidOnset', '', (value, context) => {
        const { path, createError, parent } = context;
        const newDate = value ? moment(value) : null;
        const today = moment().endOf('day');

        if (newDate === null) return true;
        if (newDate.isAfter(today)) {
            return createError({
                path,
                message: formatMessage(MESSAGES.futureDateError),
            });
        }
        const virusNotification = parent.cvdpv2_notified_at
            ? moment(parent.cvdpv2_notified_at)
            : null;
        if (virusNotification && newDate.isAfter(virusNotification)) {
            return createError({
                path,
                message: formatMessage(MESSAGES.onsetAfterNotificationError),
            });
        }
        const outbreakDeclaration = parent.outbreak_declaration_date
            ? moment(parent.outbreak_declaration_date)
            : null;

        if (outbreakDeclaration && newDate.isAfter(outbreakDeclaration)) {
            return createError({
                path,
                message: formatMessage(
                    MESSAGES.onsetAfterOutbreakDeclarationError,
                ),
            });
        }
        return true;
    });
});
yup.addMethod(
    yup.date,
    'isValidVirusNotification',
    function isValidVirusNotification(formatMessage) {
        return this.test('isValidVirusNotification', '', (value, context) => {
            const { path, createError, parent } = context;
            const newDate = value ? moment(value) : null;
            const today = moment().endOf('day');

            if (newDate === null) return true;
            if (newDate.isAfter(today)) {
                return createError({
                    path,
                    message: formatMessage(MESSAGES.futureDateError),
                });
            }
            const onset = parent.onset_at ? moment(parent.onset_at) : null;
            if (onset && newDate.isBefore(onset)) {
                return createError({
                    path,
                    message: formatMessage(
                        MESSAGES.onsetAfterNotificationError,
                    ),
                });
            }

            const outbreakDeclaration = parent.outbreak_declaration_date
                ? moment(parent.outbreak_declaration_date)
                : null;

            if (outbreakDeclaration && newDate.isAfter(outbreakDeclaration)) {
                return createError({
                    path,
                    message: formatMessage(
                        MESSAGES.virusNotificationAfterOutbreakDeclarationError,
                    ),
                });
            }
            return true;
        });
    },
);
yup.addMethod(
    yup.date,
    'isValidOutbreakDeclaration',
    function isValidOutbreakDeclaration(formatMessage) {
        return this.test('isValidOutbreakDeclaration', '', (value, context) => {
            const { path, createError, parent } = context;
            const newDate = value ? moment(value) : null;
            const today = moment().endOf('day');

            if (newDate === null) return true;
            if (newDate.isAfter(today)) {
                return createError({
                    path,
                    message: formatMessage(MESSAGES.futureDateError),
                });
            }
            const onset = parent.onset_at ? moment(parent.onset_at) : null;
            if (onset && newDate.isBefore(onset)) {
                return createError({
                    path,
                    message: formatMessage(
                        MESSAGES.onsetAfterOutbreakDeclarationError,
                    ),
                });
            }
            const virusNotification = parent.cvdpv2_notified_at
                ? moment(parent.cvdpv2_notified_at)
                : null;
            if (virusNotification && newDate.isBefore(virusNotification)) {
                return createError({
                    path,
                    message: formatMessage(
                        MESSAGES.virusNotificationAfterOutbreakDeclarationError,
                    ),
                });
            }
            return true;
        });
    },
);

yup.addMethod(
    yup.number,
    'hasAllFormAFieldsNumber',
    function hasAllFormAFieldsNumber(formatMessage) {
        return this.test('hasAllFormAFieldsNumber', '', (value, context) => {
            const { path, createError, parent } = context;
            const {
                forma_reception,
                forma_missing_vials,
                forma_usable_vials,
                forma_unusable_vials,
                forma_date,
            } = parent;
            if (
                !value &&
                value !== 0 &&
                !forma_unusable_vials &&
                !forma_usable_vials &&
                !forma_missing_vials &&
                !forma_reception &&
                !forma_date
            ) {
                return true;
            }
            if (
                !value &&
                value !== 0 &&
                !(
                    forma_unusable_vials &&
                    forma_usable_vials &&
                    forma_missing_vials &&
                    forma_reception &&
                    forma_date
                )
            ) {
                return createError({
                    path,
                    message: formatMessage(MESSAGES.formaFieldsTogether),
                });
            }
            return true;
        });
    },
);
yup.addMethod(
    yup.date,
    'hasAllFormAFieldsDate',
    function hasAllFormAFieldsDate(formatMessage) {
        return this.test('hasAllFormAFieldsDate', '', (value, context) => {
            const { path, createError, parent } = context;
            const {
                forma_reception,
                forma_missing_vials,
                forma_usable_vials,
                forma_unusable_vials,
                forma_date,
            } = parent;
            if (
                !value &&
                !forma_unusable_vials &&
                !forma_usable_vials &&
                !forma_missing_vials &&
                !forma_reception &&
                !forma_date
            ) {
                return true;
            }
            if (
                !value &&
                !(
                    forma_unusable_vials &&
                    forma_usable_vials &&
                    forma_missing_vials &&
                    forma_reception &&
                    forma_date
                )
            ) {
                return createError({
                    path,
                    message: formatMessage(MESSAGES.formaFieldsTogether),
                });
            }
            return true;
        });
    },
);
yup.addMethod(
    yup.date,
    'hasAllShipmentFieldsDate',
    function hasAllShipmentFieldsDate(formatMessage) {
        return this.test('hasAllShipmentFieldsDate', '', (value, context) => {
            const { path, createError, parent } = context;
            const {
                date_reception,
                estimated_arrival_date,
                reception_pre_alert,
                vials_received,
                po_numbers,
                vaccine_name,
            } = parent;
            if (
                !value &&
                !(
                    vaccine_name &&
                    po_numbers &&
                    vials_received &&
                    reception_pre_alert &&
                    estimated_arrival_date &&
                    date_reception
                )
            ) {
                return createError({
                    path,
                    message: formatMessage(MESSAGES.shipmentFieldsTogether),
                });
            }
            return true;
        });
    },
);
yup.addMethod(
    yup.number,
    'hasAllShipmentFieldsNumber',
    function hasAllShipmentFieldsNumber(formatMessage) {
        return this.test('hasAllShipmentFieldsNumber', '', (value, context) => {
            const { path, createError, parent } = context;
            const {
                date_reception,
                estimated_arrival_date,
                reception_pre_alert,
                vials_received,
                po_numbers,
                vaccine_name,
            } = parent;
            if (
                !value &&
                value !== 0 &&
                !(
                    vaccine_name &&
                    po_numbers &&
                    vials_received &&
                    reception_pre_alert &&
                    estimated_arrival_date &&
                    date_reception
                )
            ) {
                return createError({
                    path,
                    message: formatMessage(MESSAGES.shipmentFieldsTogether),
                });
            }
            return true;
        });
    },
);

yup.addMethod(
    yup.date,
    'destructionFieldsDateCheck',
    function destructionFieldsDateCheck(formatMessage) {
        return this.test('destructionFieldsDateCheck', '', (value, context) => {
            const { path, createError, parent } = context;
            const { date_report_received, date_report, vials_destroyed } =
                parent;
            if (
                !value &&
                !(date_report && vials_destroyed && date_report_received)
            ) {
                return createError({
                    path,
                    message: formatMessage(MESSAGES.destructionFieldsTogether),
                });
            }
            return true;
        });
    },
);
yup.addMethod(
    yup.number,
    'destructionFieldsNumberCheck',
    function destructionFieldsNumberCheck(formatMessage) {
        return this.test(
            'destructionFieldsNumberCheck',
            '',
            (value, context) => {
                const { path, createError, parent } = context;
                const { date_report_received, date_report, vials_destroyed } =
                    parent;
                if (
                    !value &&
                    value !== 0 &&
                    !(date_report && vials_destroyed && date_report_received)
                ) {
                    return createError({
                        path,
                        message: formatMessage(
                            MESSAGES.destructionFieldsTogether,
                        ),
                    });
                }
                return true;
            },
        );
    },
);

yup.addMethod(
    yup.string,
    'hasAllShipmentFieldsString',
    function hasAllShipmentFieldsString(formatMessage) {
        return this.test('hasAllShipmentFieldsString', '', (value, context) => {
            const { path, createError, parent } = context;
            const {
                date_reception,
                estimated_arrival_date,
                reception_pre_alert,
                vials_received,
                po_numbers,
                vaccine_name,
            } = parent;
            if (
                !value &&
                !(
                    vaccine_name &&
                    po_numbers &&
                    vials_received &&
                    reception_pre_alert &&
                    estimated_arrival_date &&
                    date_reception
                )
            ) {
                return createError({
                    path,
                    message: formatMessage(MESSAGES.shipmentFieldsTogether),
                });
            }
            return true;
        });
    },
);

const useShipmentShape = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        vaccine_name: yup
            .string() // TODO restrict string value to vaccines
            .trim(),
        po_numbers: yup
            .number()
            .nullable()
            .integer()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        vials_received: yup
            .number()
            .nullable()
            .integer()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        reception_pre_alert: yup
            .date()
            .nullable()
            .typeError(formatMessage(MESSAGES.invalidDate)),
        estimated_arrival_date: yup
            .date()
            .nullable()
            .typeError(formatMessage(MESSAGES.invalidDate)),
        date_reception: yup
            .date()
            .nullable()
            .typeError(formatMessage(MESSAGES.invalidDate)),
        comment: yup.string().nullable(),
    });
};
const useDestructionShape = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        vials_destroyed: yup
            .number()
            .nullable()
            .integer()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        date_report: yup
            .date()
            .nullable()
            .typeError(formatMessage(MESSAGES.invalidDate)),
        date_report_received: yup
            .date()
            .nullable()
            .typeError(formatMessage(MESSAGES.invalidDate)),
        comment: yup.string().nullable(),
    });
};

const useVaccineShape = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        name: yup.string().trim(), // TODO restrict string value to vaccines
        wastage_ratio_forecast: yup
            .number()
            .nullable()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        doses_per_vial: yup
            .number()
            .nullable()
            .integer()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
    });
};

const useRoundShape = () => {
    const { formatMessage } = useSafeIntl();
    const shipment = useShipmentShape();
    const vaccine = useVaccineShape();
    const destruction = useDestructionShape();

    return yup.object().shape({
        number: yup.number().integer().min(0),
        started_at: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable()
            // .required(formatMessage(MESSAGES.fieldRequired))
            .isValidRoundStartDate(formatMessage),
        ended_at: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable()
            // .required(formatMessage(MESSAGES.fieldRequired))
            .isValidRoundEndDate(formatMessage),
        mop_up_started_at: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        mop_up_ended_at: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable()
            .min(
                yup.ref('mop_up_started_at'),
                formatMessage(MESSAGES.endDateBeforeStartDate),
            ),
        im_started_at: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        im_ended_at: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable()
            .min(
                yup.ref('im_started_at'),
                formatMessage(MESSAGES.endDateBeforeStartDate),
            ),
        lqas_started_at: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        lqas_ended_at: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable()
            .min(
                yup.ref('lqas_started_at'),
                formatMessage(MESSAGES.endDateBeforeStartDate),
            ),
        target_population: yup
            .number()
            .nullable()
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        cost: yup.number().nullable().min(0).integer(),
        lqas_district_passing: yup
            .number()
            .nullable()
            .integer()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        lqas_district_failing: yup
            .number()
            .nullable()
            .integer()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        im_percentage_children_missed_in_household: yup
            .number()
            .nullable()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        im_percentage_children_missed_out_household: yup
            .number()
            .nullable()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        im_percentage_children_missed_in_plus_out_household: yup
            .number()
            .nullable()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        awareness_of_campaign_planning: yup
            .number()
            .nullable()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        forma_unusable_vials: yup
            .number()
            .integer()
            .nullable()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        forma_usable_vials: yup
            .number()
            .integer()
            .nullable()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        forma_missing_vials: yup
            .number()
            .integer()
            .nullable()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        reporting_delays_hc_to_district: yup
            .number()
            .integer()
            .nullable()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        reporting_delays_region_to_national: yup
            .number()
            .integer()
            .nullable()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        reporting_delays_district_to_region: yup
            .number()
            .integer()
            .nullable()
            .min(0)
            .typeError(formatMessage(MESSAGES.positiveNumber)),
        forma_reception: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        forma_date: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        forma_comment: yup.string().nullable(),
        date_signed_vrf_received: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        shipments: yup.array(shipment).nullable(),
        vaccines: yup.array(vaccine).nullable(),
        destructions: yup.array(destruction).nullable(),
        percentage_covered_target_population: yup
            .number()
            .nullable()
            .integer()
            .min(0, formatMessage(MESSAGES.positiveRangeInteger))
            .max(100, formatMessage(MESSAGES.positiveRangeInteger))
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        doses_requested: yup
            .number()
            .nullable()
            .integer()
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .typeError(formatMessage(MESSAGES.positiveInteger)),
    });
};

export const useFormValidator = () => {
    const { formatMessage } = useSafeIntl();
    // eslint-disable-next-line camelcase
    const round_shape = useRoundShape();

    return yup.object().shape({
        epid: yup.string().nullable(),
        obr_name: yup.string().trim().required(),
        initial_org_unit: yup.number().positive().integer().required(),
        grouped_campaigns: yup.array(yup.number()).nullable(),
        description: yup.string().nullable(),
        onset_at: yup
            .date()
            .nullable()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .isValidOnset(formatMessage),
        cvdpv2_notified_at: yup
            .date()
            .nullable()
            .isValidVirusNotification(formatMessage),
        outbreak_declaration_date: yup
            .date()
            .nullable()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .isValidOutbreakDeclaration(formatMessage),

        cvdpv_notified_at: yup.date().nullable(),
        verification_score: yup.number().nullable().positive().integer(),

        detection_first_draft_submitted_at: yup.date().nullable(),
        detection_rrt_oprtt_approval_at: yup.date().nullable(),

        investigation_at: yup
            .date()
            .nullable()
            .typeError(formatMessage(MESSAGES.invalidDate)),
        risk_assessment_first_draft_submitted_at: yup
            .date()
            .nullable()
            .typeError(formatMessage(MESSAGES.invalidDate)),
        risk_assessment_rrt_oprtt_approval_at: yup
            .date()
            .nullable()
            .typeError(formatMessage(MESSAGES.invalidDate)),
        ag_nopv_group_met_at: yup
            .date()
            .nullable()
            .typeError(formatMessage(MESSAGES.invalidDate)),
        dg_authorized_at: yup
            .date()
            .nullable()
            .typeError(formatMessage(MESSAGES.invalidDate)),
        // Budget tab
        who_sent_budget_at_WFEDITABLE: yup.date().nullable(),
        unicef_sent_budget_at_WFEDITABLE: yup.date().nullable(),
        gpei_consolidated_budgets_at_WFEDITABLE: yup.date().nullable(),
        submitted_to_rrt_at_WFEDITABLE: yup.date().nullable(),
        feedback_sent_to_gpei_at_WFEDITABLE: yup.date().nullable(),
        re_submitted_to_rrt_at_WFEDITABLE: yup.date().nullable(),
        submitted_to_orpg_operations1_at_WFEDITABLE: yup.date().nullable(),
        feedback_sent_to_rrt1_at_WFEDITABLE: yup.date().nullable(),
        submitted_to_orpg_wider_at_WFEDITABLE: yup.date().nullable(),
        submission_to_orpg_operations_2_at_WFEDITABLE: yup.date().nullable(),
        feedback_sent_to_rrt2_at_WFEDITABLE: yup.date().nullable(),
        re_submitted_to_orpg_operations1_at_WFEDITABLE: yup.date().nullable(),
        re_submitted_to_orpg_operations2_at_WFEDITABLE: yup.date().nullable(),
        submitted_for_approval_at_WFEDITABLE: yup.date().nullable(),
        approved_by_who_at_WFEDITABLE: yup.date().nullable(),
        feedback_sent_to_orpg_operations_who_at_WFEDITABLE: yup
            .date()
            .nullable(),
        feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE: yup
            .date()
            .nullable(),
        approved_by_unicef_at_WFEDITABLE: yup.date().nullable(),
        approved_at_WFEDITABLE: yup.date().nullable(),
        approval_confirmed_at_WFEDITABLE: yup.date().nullable(),
        unicef_disbursed_to_moh_at: yup.date().nullable(),
        unicef_disbursed_to_co_at: yup.date().nullable(),
        who_disbursed_to_moh_at: yup.date().nullable(),
        who_disbursed_to_co_at: yup.date().nullable(),
        spreadsheet_url: yup.string().url().nullable(),

        eomg: yup.date().nullable(),
        budget_submitted_at: yup.date().nullable(),
        district_count: yup
            .number()
            .nullable()
            .positive()
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        no_regret_fund_amount: yup
            .number()
            .nullable()
            .positive()
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        rounds: yup.array(round_shape).nullable(),
    });
};
