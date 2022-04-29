/// <reference types='cypress' />

export const testPlugin = (name, callback) => {
    if (Cypress.env('plugins')?.includes(name)) {
        callback();
    }
};
