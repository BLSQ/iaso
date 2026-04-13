import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { array, mixed, object, ObjectSchema, string, number } from 'yup';
import { useAPIErrorValidator } from 'Iaso/libs/validation';
import { ValidationError } from 'Iaso/types/utils';
import MESSAGES from '../../../messages';

export const useBulkUserValidation = (
    errors: ValidationError,
    payload: any,
): ObjectSchema<any> => {
    const { formatMessage } = useSafeIntl();
    const apiValidator = useAPIErrorValidator<Partial<any>>(errors, payload);
    return useMemo(() => {
        return object().shape({
            file: mixed()
                .nullable()
                .required(formatMessage(MESSAGES.fieldRequired))
                .test(apiValidator('file')),
            default_organization: string()
                .nullable()
                .test(apiValidator('default_organization')),
            default_teams: array()
                .of(number())
                .nullable()
                .test(apiValidator('default_teams')),
            default_profile_language: string()
                .nullable()
                .test(apiValidator('default_profile_language')),
            default_projects: array()
                .of(number())
                .nullable()
                .test(apiValidator('default_projects')),
            default_user_roles: array()
                .of(number())
                .nullable()
                .test(apiValidator('default_user_roles')),
            default_permissions: array()
                .of(number())
                .nullable()
                .test(apiValidator('default_permissions')),
            default_org_units: array()
                .of(number())
                .nullable()
                .test(apiValidator('default_org_units')),
        });
    }, [apiValidator, formatMessage]);
};
