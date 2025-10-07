import { useMemo } from 'react';
import moment from 'moment';
import { array, date, mixed, number, object, ObjectSchema, string } from 'yup';
import { useAPIErrorValidator } from '../../../libs/validation';
import { ValidationError } from '../../../types/utils';
import { getLocaleDateFormat } from '../../../utils/dates';
import { SavePlanningQuery } from './requests/useSavePlanning';

// parse DD-MM-YYYY string to Date object

const parseStringTodate = (_yupValue, pickerValue): Date | void => {
    // skipping if null to be able to set value to null without validation error
    // because we need to be able to send null to the API
    if (pickerValue !== null) {
        const result = moment(pickerValue, getLocaleDateFormat('L')).toDate();
        return result;
    }
};

export const usePlanningValidation = (
    errors: ValidationError = {},
    payload: Partial<SavePlanningQuery>,
): ObjectSchema<any> => {
    const apiValidator = useAPIErrorValidator<Partial<SavePlanningQuery>>(
        errors,
        payload,
    );
    // Tried the typescript integration, but Type casting was crap
    const schema = useMemo(
        () =>
            object().shape({
                name: string().nullable().required('requiredField'),
                startDate: date()
                    .transform(parseStringTodate)
                    .nullable()
                    .typeError('invalidDate')
                    .test(apiValidator('startDate')),
                endDate: date()
                    .transform(parseStringTodate)
                    .nullable()
                    .typeError('invalidDate')
                    .test(apiValidator('endDate')),
                description: string().nullable(),
                project: number()
                    .nullable()
                    .required('requiredField')
                    .test(apiValidator('projects')),
                // Specifying array().of(number()) will cause a bug where the error won't show until you put another field in error
                forms: array()
                    .min(1, 'requiredField')
                    .test(apiValidator('forms')),
                selectedOrgUnit: number()
                    .nullable()
                    .test(apiValidator('selectedOrgUnit'))
                    .required('requiredField'),
                selectedTeam: number().nullable().required('requiredField'),
                publishingStatus: mixed()
                    .oneOf(['draft', 'published'])
                    .required('requiredField'),
                pipelineUuids: array().nullable(),
            }),
        [apiValidator],
    );
    return schema;
};
