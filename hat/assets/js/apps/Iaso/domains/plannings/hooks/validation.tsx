import { useMemo } from 'react';
import moment from 'moment';
import { array, date, mixed, number, object, ObjectSchema, string } from 'yup';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { getLocaleDateFormat } from '../../../utils/dates';
import { SavePlanningQuery } from './requests/useSavePlanning';
import { ValidationError } from '../../../types/utils';
import { makeAPIErrorValidator } from '../../../libs/validation';

// parse DD-MM-YYYY string to Date object
const parseStringTodate = (_yupValue, pickerValue) => {
    const result = moment(pickerValue, getLocaleDateFormat('L')).toDate();
    return result;
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
