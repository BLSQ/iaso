/// <reference types="cypress" />

const siteBaseUrl = Cypress.env('siteBaseUrl');
const sessionCookie = Cypress.env('sessionCookie');
const langageCookie = Cypress.env('langageCookie');

const signInUrl = `${siteBaseUrl}/login/`;

const selectLanguage = lang => {
    cy.window().then(w => {
        // eslint-disable-next-line no-param-reassign
        w.beforeReload = true;
    });

    // Ensure selector is ready
    cy.get('.language-picker')
        .should('exist')
        .should('be.visible')
        .and('not.be.disabled');

    // Select language
    cy.get('.language-picker').select(lang, { force: true });

    // Wait for the HTML lang attribute to update
    cy.get('html', { timeout: 15000 }).should('have.attr', 'lang', lang);

    // Re-query the select after reload/update
    cy.get('.language-picker', { timeout: 10000 }).should('have.value', lang);

    // Wait for the cookie to be set
    cy.getCookie(langageCookie, { timeout: 10000 }).should(
        'have.property',
        'value',
        lang,
    );

    // Optionally, check the beforeReload property is gone
    cy.window().should('not.have.prop', 'beforeReload');
};

describe('Log in page', () => {
    before(() => {
        cy.clearCookie(sessionCookie);
    });
    beforeEach(() => {
        cy.visit(siteBaseUrl);
        cy.intercept('GET', '/sockjs-node/**').as('Yabadabadoo');
    });
    it('going to root url should redirect to log in page', () => {
        cy.url().should('include', signInUrl); // using include to account for redirection with next=
    });
    it('click on forgot password should redirect to sign up page', () => {
        cy.get('.forgot-link').click();
        cy.url().should('eq', `${siteBaseUrl}/forgot-password/`);
    });
    it('click display password should toggle input password type', () => {
        cy.get('#display-password').click();
        cy.get('#id_password').invoke('attr', 'type').should('equal', 'text');
        cy.get('#display-password').click();
        cy.get('#id_password')
            .invoke('attr', 'type')
            .should('equal', 'password');
    });
    it('sessionId cookie should be empty', () => {
        cy.getCookie(sessionCookie).should('not.exist');
    });
    describe('Unhappy flow', () => {
        beforeEach(() => {
            cy.visit(signInUrl);
            cy.get('#id_username').should('be.visible');
        });
        it('missing unsername should not submit login', () => {
            cy.get('#id_password')
                .should('be.visible')
                .and('not.be.disabled')
                .and('not.have.attr', 'readonly');
            cy.get('#id_password').invoke('val', 'Link');
            cy.get('#submit').click();
            cy.url().should('eq', signInUrl);
        });
        it('missing password should not submit login', () => {
            cy.get('#id_username')
                .should('exist')
                .should('be.visible')
                .and('not.be.disabled')
                .and('not.have.attr', 'readonly');
            cy.get('#id_username').then($input => {
                const input = $input[0];
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype,
                    'value',
                ).set;
                nativeInputValueSetter.call(input, 'Link');
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            });
            cy.get('#submit').click();
            cy.url().should('eq', signInUrl);
        });
        // TODO: fix this, it's flaky on github actions
        it.skip('wrong credentials should display error message', () => {
            // Handle username input
            cy.get('#id_username')
                .should('exist')
                .should('be.visible')
                .and('not.be.disabled')
                .and('not.have.attr', 'readonly');
            cy.get('#id_username').then($input => {
                const input = $input[0];
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype,
                    'value',
                ).set;
                nativeInputValueSetter.call(input, 'Link');
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            });

            // Handle password input
            cy.get('#id_password')
                .should('exist')
                .should('be.visible')
                .and('not.be.disabled')
                .and('not.have.attr', 'readonly');
            cy.get('#id_password').invoke('val', 'ZELDA');
            cy.get('#id_password').trigger('input');
            cy.get('#id_password').trigger('change');

            cy.get('.auth__text--error').should('not.exist');
            cy.get('#submit').click();
            cy.get('.auth__text--error').should('be.visible');
        });
    });
    describe('language selector', () => {
        beforeEach(() => {
            cy.visit(signInUrl);
        });
        it('should default to english', () => {
            cy.get('html').invoke('attr', 'lang').should('equal', 'en');
        });
        // this test is flakky and pass sometimes, so we skip it, we need more time to focus on this
        it.skip('should set page to selected language', () => {
            selectLanguage('fr');
            selectLanguage('en');
        });
    });
    describe('Happy flow', () => {
        beforeEach(() => {
            cy.login();
            cy.visit(siteBaseUrl);
        });
        it('should redirect to dashboard', () => {
            cy.url().should('not.contain', `next`);
            cy.url().should('contain', `/dashboard`);
        });
        it('should set sessionid', () => {
            cy.getCookie(sessionCookie).should('exist');
        });
    });
});
