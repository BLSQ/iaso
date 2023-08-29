import { object, string, ObjectSchema } from 'yup';

export const useAccountValidation = (): ObjectSchema<any> => {
    return object().shape({
        accountName: string().nullable().required('requiredField'),
        userName: string().nullable().required('requiredField'),
        firstName: string().nullable().required('requiredField'),
        lastName: string().nullable().required('requiredField'),
        password: string().nullable().required('requiredField'),
    });
};
