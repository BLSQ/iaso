import { useMemo } from 'react';
import moment from 'moment';
import {
    array,
    date,
    mixed,
    number,
    object,
    ObjectSchema,
    string,
    TestConfig,
} from 'yup';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';
import { getLocaleDateFormat } from '../../utils/dates';
import { SavePlanningQuery } from './hooks/requests/useSavePlanning';
import { IntlFormatMessage } from '../../types/intl';

// parse DD-MM-YYYY string to Date object
const parseStringTodate = (_yupValue, pickerValue) => {
    const result = moment(pickerValue, getLocaleDateFormat('L')).toDate();
    return result;
};

export type ValidationError = Record<string, string> | null | undefined;

// TODO: check if this wouldn't cause too many renders
export const makeAPIErrorValidator =
    <T,>(
        errors: ValidationError,
        payload: T,
        formatMessage: IntlFormatMessage,
        messages: any,
    ) =>
    (fieldKey: string) => {
        return {
            name: `API Errors ${fieldKey}`,
            test: value => {
                if (errors?.[fieldKey] && value === payload?.[fieldKey])
                    return false;
                return true;
            },
            message: errors?.[fieldKey]
                ? formatMessage(messages[errors?.[fieldKey]]) ??
                  errors?.[fieldKey]
                : null,
        } as TestConfig<any, Record<string, any>>;
    };

export const usePlanningValidation = (
    errors: ValidationError = {},
    payload: Partial<SavePlanningQuery>,
): ObjectSchema<any> => {
    const { formatMessage } = useSafeIntl();
    const errorMessage = formatMessage(MESSAGES.requiredField);
    const datesError = formatMessage(MESSAGES.invalidDate);
    const apiValidator = useMemo(
        () =>
            makeAPIErrorValidator<Partial<SavePlanningQuery>>(
                errors,
                payload,
                formatMessage,
                MESSAGES,
            ),
        [errors, formatMessage, payload],
    );
    // Tried the typescript integration, but Type casting was crap
    const schema = useMemo(
        () =>
            object().shape({
                name: string().nullable().required(errorMessage),
                startDate: date()
                    .transform(parseStringTodate)
                    .nullable()
                    .typeError(datesError),
                endDate: date()
                    .transform(parseStringTodate)
                    .nullable()
                    .typeError(datesError),
                description: string().nullable(),
                project: number()
                    .nullable()
                    .required(errorMessage)
                    .test(apiValidator('projects')),
                // Specifying array().of(number()) will cause a bug where the error won't show until you put another field in error
                forms: array().min(1, errorMessage).test(apiValidator('forms')),
                selectedOrgUnit: number()
                    .nullable()
                    .test(apiValidator('selectedOrgUnit'))
                    .required(errorMessage),
                selectedTeam: number().nullable().required(errorMessage),
                publishingStatus: mixed()
                    .oneOf(['draft', 'published'])
                    .required(errorMessage),
            }),
        [apiValidator, datesError, errorMessage],
    );
    return schema;
};
