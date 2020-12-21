import appReducer, { appInitialState } from './reducer';
import { SWITCH_LOCALE } from './actions';
import { APP_LOCALES } from './constants';

describe('App reducer', () => {
    it('should return the initial state', () => {
        expect(appReducer(undefined)).to.eql(appInitialState());
    });

    it('should respond to SWITCH_LOCALE', () => {
        const localeCode = 'en';
        const payload = { localeCode };
        const action = {
            type: SWITCH_LOCALE,
            payload,
        };
        const expectedState = {
            locale: APP_LOCALES[1],
        };
        expect(appReducer({}, action)).to.eql(expectedState);
    });

    it('should respond to SWITCH_LOCALE and return first locale if not found', () => {
        const localeCode = 'ZELDA';
        const payload = { localeCode };
        const action = {
            type: SWITCH_LOCALE,
            payload,
        };
        const expectedState = {
            locale: APP_LOCALES[0],
        };
        expect(appReducer({}, action)).to.eql(expectedState);
    });
});
