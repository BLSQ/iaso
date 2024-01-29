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
        obr_name: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        lot_numbers_for_usable_vials: yup
            .mixed()
            .nullable()
            // TS can't detect the added method
            // @ts-ignore
            .isNumbersArrayString(formatMessage),
        date_of_report: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        forma_reception_rrt: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        vials_used: yup
            .number()
            .nullable()
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        vials_missing: yup
            .number()
            .nullable()
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        unusable_vials: yup
            .number()
            .nullable()
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
        destruction_reception_rrt: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        date_of_report: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        vials_destroyed: yup
            .number()
            .nullable()
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
        incident_reception_rrt: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        date_of_report: yup
            .date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        usable_vials: yup
            .number()
            .nullable()
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        unusable_vials: yup
            .number()
            .nullable()
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
    });
};
