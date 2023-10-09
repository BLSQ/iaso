import { useMemo } from 'react';
import { object, ObjectSchema, string } from 'yup';
import { APP_LOCALES } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/app/constants';
import { useAPIErrorValidator } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/validation';
import { ValidationError } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';

const translatedFields = apiValidator => {
    const result = {};
    APP_LOCALES.forEach(locale => {
        const key = `name_${locale.code}`;
        if (locale.code === 'en') {
            result[key] = string()
                .nullable()
                .required('requiredField')
                .test(apiValidator(key));
        } else {
            result[key] = string().nullable().test(apiValidator(key));
        }
    });
    return result;
};

export const useReasonsForDelayValidation = (
    errors: ValidationError = {},
    payload: Partial<any>,
): ObjectSchema<any> => {
    const apiValidator = useAPIErrorValidator<Partial<any>>(errors, payload);
    // Tried the typescript integration, but Type casting was crap
    const schema = useMemo(
        () =>
            object().shape({
                key_name: string()
                    .nullable()
                    .required('requiredField')
                    .test(apiValidator('key_name')),
                ...translatedFields(apiValidator),
            }),
        [apiValidator],
    );
    return schema;
};
