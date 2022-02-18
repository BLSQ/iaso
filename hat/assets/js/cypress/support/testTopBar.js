export const testTopBar = (baseUrl, topBarText) =>
    it('Displays TopBar with title and menu', () => {
        cy.visit(baseUrl);
        cy.get('#menu-button').should('exist');
        cy.get('#top-bar-title').should('contain', topBarText);
    });
