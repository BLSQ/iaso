import { forbiddenCharacters } from '../constants/forbiddenChars';
import { containsForbiddenCharacter } from './utils';

const notDisabledDomains = ['orgunits', 'forms', 'instances'];
export const testSearchField = (
    search,
    searchWithForbiddenChars,
    domain = undefined,
) => {
    it('should enable search button', () => {
        cy.get('[data-test="search-button"]')
            .as('search-button')
            .should(
                notDisabledDomains.includes(domain)
                    ? 'not.be.disabled'
                    : 'be.disabled',
            );
        cy.get('#search-search').type(search);
        cy.get('@search-button').should('not.be.disabled');
    });

    it('should disable search button if search contains forbidden characters', () => {
        cy.get('[data-test="search-button"]')
            .as('search-button')
            .should(
                notDisabledDomains.includes(domain)
                    ? 'not.be.disabled'
                    : 'be.disabled',
            );
        cy.get('#search-search').type(searchWithForbiddenChars);
        if (
            containsForbiddenCharacter(
                searchWithForbiddenChars,
                forbiddenCharacters,
            )
        ) {
            cy.get('@search-button').should('be.disabled');
        }
    });
};
