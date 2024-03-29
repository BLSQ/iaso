import { ValidationError } from 'yup';
import { CampaignFormValues } from '../../../constants/types';
import { useFormValidator } from '../../../hooks/useFormValidator';
import { useIsPolioCampaignCheck } from './useIsPolioCampaignCheck';

//  We use a custom validation function to handle the validation of the campaign
//  based on the campaign type as the schema is different for polio and non polio
//  campaigns.

export const useValidateCampaign = (): ((
    // eslint-disable-next-line no-unused-vars
    values: CampaignFormValues,
) => Promise<Record<string, string>>) => {
    const { plainSchema, polioSchema } = useFormValidator();
    const isPolio = useIsPolioCampaignCheck();

    return async (values: CampaignFormValues) => {
        const schema = isPolio(values) ? polioSchema : plainSchema;
        try {
            await schema.validate(values, { abortEarly: false });
            return {};
        } catch (error) {
            // Check if the error is a Yup ValidationError and has an inner array
            if (error instanceof ValidationError && error.inner) {
                return error.inner.reduce((acc, err) => {
                    const path = err.path || 'unknownPath';
                    if (!acc[path]) {
                        acc[path] = err.message;
                    }
                    return acc;
                }, {});
            }
            console.error(
                "Validation failed, but it wasn't a Yup ValidationError:",
                error,
            );
            return { _error: error.message || 'An unknown error occurred' };
        }
    };
};
