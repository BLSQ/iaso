import superUser from '../fixtures/profiles/me/superuser.json';

// cy.login() and required intercepts should be called in a parent describe or beforeEach
export const testPermission = baseUrl =>
    it('page should not be accessible if user does not have permission', () => {
        const fakeUser = {
            ...superUser,
            permissions: [],
            is_superuser: false,
        };
        cy.intercept('GET', '/api/profiles/me/**', fakeUser);
        cy.visit(baseUrl);
        const errorCode = cy.get('#error-code');
        errorCode.should('contain', '403');
    });
