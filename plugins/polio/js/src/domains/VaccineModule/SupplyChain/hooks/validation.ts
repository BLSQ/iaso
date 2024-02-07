import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import * as yup from 'yup';
import MESSAGES from '../messages';

yup.addMethod(
    yup.mixed,
    'isNumbersArrayString',
    function isNumbersArrayString(formatMessage) {
        return this.test('isNumbersArrayString', '', (value, context) => {
            const { path, createError } = context;
            let errorMessage;
            if (value) {
                const regexp = /^\d*$/;

                const valuesArray = Array.isArray(value)
                    ? value
                    : value
                          .split(',')
                          .map((v: string | number) => `${v}`.trim());
                const hasOtherChar = valuesArray.some(v => !regexp.test(v));
                if (hasOtherChar) {
                    errorMessage = formatMessage(MESSAGES.lotNumberError);
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

const useVrfShape = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        id: yup.string().nullable(),
        country: yup
            .number()
            .required(formatMessage(MESSAGES.requiredField))
            .nullable()
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        campaign: yup
            .string()
            .required(formatMessage(MESSAGES.requiredField))
            .nullable(),
        vaccine_type: yup
            .string()
            .required(formatMessage(MESSAGES.requiredField))
            .nullable(),
        rounds: yup
            .mixed()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        date_vrf_signature: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        quantities_ordered_in_doses: yup
            .number()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField))
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        wastage_rate_used_on_vrf: yup
            .number()
            .nullable()
            .min(0, formatMessage(MESSAGES.positiveNumber)),
        date_vrf_reception: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        date_vrf_submission_to_orpg: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        quantities_approved_by_orpg_in_doses: yup
            .number()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField))
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        date_rrt_orpg_approval: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        date_vrf_submitted_to_dg: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        quantities_approved_by_dg_in_doses: yup
            .number()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField))
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        date_dg_approval: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        comments: yup.string().nullable(),
    });
};

const usePreAlertShape = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        date_pre_alert_reception: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        po_number: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        lot_numbers: yup
            .mixed()
            .nullable()
            // TS can't detect the added method
            // @ts-ignore
            .isNumbersArrayString(formatMessage),
        estimated_arrival_time: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        expiration_date: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        doses_shipped: yup
            .number()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField))
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
    });
};
const useArrivalReportShape = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        arrival_report_date: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        po_number: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        lot_numbers: yup
            .mixed()
            .nullable()
            // TS can't detect the added method
            // @ts-ignore
            .isNumbersArrayString(formatMessage),
        doses_per_vial: yup
            .number()
            .nullable()
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        expiration_date: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        doses_shipped: yup
            .number()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField))
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        doses_received: yup
            .number()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField))
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
    });
};

export const useSupplyChainFormValidator = () => {
    const vrf = useVrfShape();
    const preAlert = usePreAlertShape();
    const arrivalReport = useArrivalReportShape();
    return useMemo(() => {
        return yup.object().shape({
            vrf,
            pre_alerts: yup.array().of(preAlert),
            arrival_reports: yup.array().of(arrivalReport),
        });
    }, [vrf, preAlert, arrivalReport]);
};
