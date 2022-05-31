import { useMemo } from 'react';
import moment from 'moment';
import { array, date, mixed, number, object, ObjectSchema, string } from 'yup';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';
import { getLocaleDateFormat } from '../../utils/dates';

// parse DD-MM-YYYY string to Date object
const parseStringTodate = (_yupValue, pickerValue) => {
    const result = moment(pickerValue, getLocaleDateFormat('L')).toDate();
    return result;
};

export type ValidationError =
    | {
          // eslint-disable-next-line camelcase
          non_field_errors: Record<string, string>[]; // [{forms:"error"}, {"org_unit":"error"}]
      }
    | Record<string, string>
    | null;

export const usePlanningValidation = (
    errors: ValidationError,
): ObjectSchema<any> => {
    const { formatMessage } = useSafeIntl();
    const errorMessage = formatMessage(MESSAGES.requiredField);
    const datesError = formatMessage(MESSAGES.invalidDate);
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
                project: number().nullable().required(errorMessage),
                // .test(
                //     'API Errors',
                //     'GNAGANAGA',
                //     // apiError => `${apiError}`,
                //     function (value, context) {
                //         let error = '';
                //         if (errors?.non_field_errors) {
                //             error = errors.non_field_errors.project;
                //         } else {
                //             error = errors?.project;
                //         }
                //         if (error) {
                //             return false;
                //         }
                //         return true;
                //     },
                // ),
                // Specifying array().of(number()) will cause a bug where the error won't show until you put another field in error
                forms: array()
                    .test({
                        name: 'API Errors',
                        test: (value, context) => {
                            let result = true;
                            let err: string | undefined = '';
                            if (errors?.non_field_errors) {
                                err = (
                                    errors.non_field_errors as Record<
                                        string,
                                        string
                                    >[]
                                ).find(fieldError =>
                                    Object.keys(fieldError).includes('forms'),
                                )?.forms; // TODO make finder function;
                            } else {
                                err = (errors as Record<string, string>)?.forms;
                            }
                            // console.log('YUP', err);
                            if (err) {
                                result = false;
                            }
                            return result;
                        },
                        message: 'MESSAGE',
                        params: { title: 'FORMS!' },
                    })
                    .min(1, errorMessage),
                selectedOrgUnit: number().nullable().required(errorMessage),
                selectedTeam: number().nullable().required(errorMessage),
                publishingStatus: mixed()
                    .oneOf(['draft', 'published'])
                    .required(errorMessage),
            }),
        [datesError, errorMessage, errors],
    );
    return schema;
};
