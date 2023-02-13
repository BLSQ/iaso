import { get } from 'lodash';

export const compareArraysValues = (
    formFields: string[],
    errors: Record<string, any>,
): boolean => {
    return Boolean(formFields.find(formfield => get(errors, formfield)));
    //     console.log('field errors', fieldErrors);
    //     return Object.entries(fieldErrors).some(fieldError =>
    //         form.includes(fieldError[0]),
    //     );
};
