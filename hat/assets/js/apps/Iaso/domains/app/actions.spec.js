import { SWITCH_LOCALE, switchLocale } from './actions';

describe('App actions', () => {
    it('should create an action to switch locale', () => {
        const localeCode = 'en';
        const expectedAction = {
            type: SWITCH_LOCALE,
            payload: {
                localeCode,
            },
        };

        const action = switchLocale(localeCode);
        expect(action).to.eql(expectedAction);
    });
    it('should throw an error if localeCodeis unknown', () => {
        const localeCode = 'ZELDA';
        expect(() => switchLocale(localeCode)).to.throw(
            `Invalid locale code ${localeCode}`,
        );
    });
});
