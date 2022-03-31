/// <reference types='cypress' />

export const getCoordinates = element =>
    cy.wrap(element[0].getBoundingClientRect());
