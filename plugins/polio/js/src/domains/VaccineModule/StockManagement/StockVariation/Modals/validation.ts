import { useSafeIntl } from 'bluesquare-components';
import * as yup from 'yup';
import MESSAGES from '../../messages';

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

export const useFormAValidation = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        campaign: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        lot_numbers_for_usable_vials: yup
            .mixed()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField))
            // TS can't detect the added method
            // @ts-ignore
            .isNumbersArrayString(formatMessage),
        report_date: yup
            .date()
            .required(formatMessage(MESSAGES.requiredField))
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        form_a_reception_date: yup
            .date()
            .required(formatMessage(MESSAGES.requiredField))
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        vials_used: yup
            .number()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField))
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        missing_vials: yup
            .number()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField))
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        unusable_vials: yup
            .number()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField))
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
    });
};

export const useDestructionValidation = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        action: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        rrt_destruction_report_reception_date: yup
            .date()
            .required()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        destruction_report_date: yup
            .date()
            .required(formatMessage(MESSAGES.requiredField))
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        unusable_vials_destroyed: yup
            .number()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField))
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        lot_numbers: yup
            .mixed()
            .nullable()
            // TS can't detect the added method
            // @ts-ignore
            .isNumbersArrayString(formatMessage),
    });
};
export const useIncidentValidation = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        stock_correction: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)), // can be made more strict witha ccepted values from dropdown
        incident_report_received_by_rrt: yup
            .date()
            .required(formatMessage(MESSAGES.requiredField))
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        date_of_incident_report: yup
            .date()
            .required(formatMessage(MESSAGES.requiredField))
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        usable_vials: yup
            .number()
            .required(formatMessage(MESSAGES.requiredField))
            .nullable()
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        unusable_vials: yup
            .number()
            .required(formatMessage(MESSAGES.requiredField))
            .nullable()
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
    });
};
