import { arrayReducer } from './useArrayState';

describe('useArrayState\'s arrayReducer', () => {
    it('does not mutate the original state', () => {
        const state = [1, 2, 3, 4];
        const result = arrayReducer(state, { index: 0, value: 1 });
        expect(state).to.not.equal(result);
    });

    it('inserts the new element at the right index', () => {
        const state = [1, 2, 3, 4];
        const result = arrayReducer(state, { index: 0, value: 100 });
        expect(result[0]).to.equal(100);
    });

    it('replaces the whole array if index === "all"', () => {
        const state = [1, 2, 3, 4];
        const newValue = [100, 200, 300, 400, 500];
        const result = arrayReducer(state, { index: 'all', value: newValue });
        expect(result).to.deep.equal(newValue);
    });

    // todo : see remark in arrayReducer def, with proper typescript checking, it wouldn't happen.
    it('does not replace state if value is not an array and logs an error to the console', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        });
        const state = [1, 2, 3, 4];
        const newValue = 'BOOM!';
        const result = arrayReducer(state, { index: 'all', value: newValue });
        expect(result).to.equal(state);
        expect(consoleSpy).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(`expected value of type "Array", got ${newValue}`);
        consoleSpy.mockRestore();
    });
});
