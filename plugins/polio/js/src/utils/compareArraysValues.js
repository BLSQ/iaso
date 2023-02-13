export const compareArraysValues = (form, fieldErrors) => {
    console.log('field errors', fieldErrors);
    return Object.entries(fieldErrors).some(fieldError =>
        form.includes(fieldError[0]),
    );
};
