/* global describe, it */
import assert from 'assert';
import * as selection from './selection';

describe('Microplanning selection redux', () => {
    describe('actions', () => {

        it('should create the display item action', () => {
            assert.deepEqual(
                selection.displayItem(),
                { type: selection.DISPLAY_ITEM, payload: undefined },
            );
        });

        it('should create the change buffer size action', () => {
            assert.deepEqual(
                selection.changeBufferSize(1),
                { type: selection.BUFFER_SIZE_CHANGE, payload: 1 },
            );
        });
    });

    describe('reducer', () => {
        const reducer = selection.selectionReducer;
        const initialState = selection.selectionInitialState;

        it('should return the default state', () => {
            assert.deepEqual(reducer(), initialState);
        });

        it('should only accept positive buffer sizes', () => {

            assert.deepEqual(
                reducer(undefined, { type: selection.HIGHLIGHT_BUFFER_SIZE_CHANGE, payload: -1 }),
                initialState,
            );
        });
    });
});
