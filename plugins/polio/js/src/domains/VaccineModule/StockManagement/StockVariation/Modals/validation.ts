import { useSafeIntl } from 'bluesquare-components';
import * as yup from 'yup';
import MESSAGES from '../../messages';

export const useFormAValidation = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        obr_name: yup
            .string()
            .nullable()
            .required(formatMessage(MESSAGES.requiredField)),
        lot_numbers_for_usable_vials: yup.string().nullable(), // actually an array of numbers in string form. custom test should be added
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
        lot_numbers: yup.string().nullable(), // actually an array of numbers in string form. custom test should be added
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
        unusable_vials: yup
            .number()
            .nullable()
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
    });
};
