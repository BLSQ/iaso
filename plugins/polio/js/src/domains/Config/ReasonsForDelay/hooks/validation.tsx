import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { object, ObjectSchema, string } from 'yup';
import { useAppLocales } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/app/constants';
import { useAPIErrorValidator } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/validation';
import { ValidationError } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import MESSAGES from '../../../../constants/messages';

const translatedFields = (apiValidator, appLocales) => {
    const result = {};
    appLocales.forEach(locale => {
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
    const { formatMessage } = useSafeIntl();
    const appLocales = useAppLocales();
    const apiValidator = useAPIErrorValidator<Partial<any>>(errors, payload);
    // Tried the typescript integration, but Type casting was crap
    const schema = useMemo(
        () =>
            object().shape({
                key_name: string()
                    .nullable()
                    .required('requiredField')
                    .test(apiValidator('key_name'))
                    .matches(/^[A-Z_]+$/, {
                        message: formatMessage(MESSAGES.incorrectFormat),
                    }),
                ...translatedFields(apiValidator, appLocales),
            }),
        [apiValidator, appLocales],
    );
    return schema;
};
