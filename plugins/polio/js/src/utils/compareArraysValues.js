export const compareArraysValues = (form, fieldErrors) => {
    return Object.entries(fieldErrors).some(err => form.includes(err[0]));
};
