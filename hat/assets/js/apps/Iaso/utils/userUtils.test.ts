import { faker } from '@faker-js/faker';
import { textPlaceholder } from 'bluesquare-components';
import getDisplayName from './usersUtils';

describe('Testing getDisplayData function', () => {
    it('returns placeholder when user is undefined', () => {
        const result = getDisplayName(undefined as any);

        expect(result).toBe(textPlaceholder);
    });

    it('returns username when firstName and lastName are missing', () => {
        const userName = faker.internet.username();

        const result = getDisplayName({
            userName,
        });

        expect(result).toBe(userName);
    });

    it('returns username with first and last name', () => {
        const userName = faker.internet.username();
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();

        const result = getDisplayName({
            userName,
            firstName,
            lastName,
        });

        expect(result).toBe(`${userName} (${firstName} ${lastName})`);
    });

    it('returns username with only firstName', () => {
        const userName = faker.internet.username();
        const firstName = faker.person.firstName();

        const result = getDisplayName({
            userName,
            firstName,
        });

        expect(result).toBe(`${userName} (${firstName})`);
    });

    it('returns username with only lastName', () => {
        const userName = faker.internet.username();
        const lastName = faker.person.lastName();

        const result = getDisplayName({
            userName,
            lastName,
        });

        expect(result).toBe(`${userName} (${lastName})`);
    });

    it('returns empty string when no names and no username', () => {
        const result = getDisplayName({});

        expect(result).toBe('');
    });
});
