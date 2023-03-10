/// <reference types='cypress' />

export const getCoordinates = element =>
    cy.wrap(element[0].getBoundingClientRect());

export const containsForbiddenCharacter = (value, forbiddenCharacters) => {
    for (let i = 0; i < value.length; i += 1) {
        if (forbiddenCharacters.includes(value[i])) return true;
    }
    return false;
};
