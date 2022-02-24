// TODO test menu display/redirection on Icon click
export const testTopBar = (baseUrl, topBarText, backButton = false) =>
    it('Displays TopBar with title and menu', () => {
        const selector = backButton ? '#top-bar-back-button' : '#menu-button';
        cy.visit(baseUrl);
        cy.get(selector).should('exist');
        cy.get('#top-bar-title').should('contain', topBarText);
    });
