/* global describe, it */
import assert from 'assert';
import * as selection from './selection';

xdescribe('Microplanning selection redux', () => {
    describe('actions', () => {
        it('should create the disable selection action', () => {
            assert.deepEqual(
                selection.disableSelection(),
                { type: selection.SELECTION_MODE_CHANGE, payload: 0 },
            );
        });

        it('should create the change selection mode action', () => {
            assert.deepEqual(
                selection.changeMode(1),
                { type: selection.SELECTION_MODE_CHANGE, payload: 1 },
            );
        });

        it('should create the execute selection action', () => {
            assert.deepEqual(
                selection.executeSelection([1, 2, 3]),
                { type: selection.SELECTION_EXECUTE, payload: [1, 2, 3] },
            );
        });

        it('should create the select items action', () => {
            assert.deepEqual(
                selection.selectItems([1, 2, 3]),
                { type: selection.SELECT_ITEMS, payload: [1, 2, 3] },
            );
        });

        it('should create the deselect items action', () => {
            assert.deepEqual(
                selection.deselectItems([1, 2, 3]),
                { type: selection.DESELECT_ITEMS, payload: [1, 2, 3] },
            );
        });

        it('should create the reset selection action', () => {
            assert.deepEqual(
                selection.deselectItems(),
                { type: selection.DESELECT_ITEMS, payload: undefined },
            );
        });

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

        it('should create the change highlight buffer size action', () => {
            assert.deepEqual(
                selection.changeHighlightBufferSize(1),
                { type: selection.HIGHLIGHT_BUFFER_SIZE_CHANGE, payload: 1 },
            );
        });
    });

    describe('reducer', () => {
        const reducer = selection.selectionReducer;
        const initialState = selection.selectionInitialState;

        it('should return the default state', () => {
            assert.deepEqual(reducer(), initialState);
        });

        it('should do nothing on executing selection action if selection mode is disabled', () => {
            assert.deepEqual(
                reducer(undefined, {
                    type: selection.SELECTION_EXECUTE,
                    payload: [{ id: 1 }],
                }),
                initialState,
            );
        });

        it('should include items on executing selection action if selection mode is select', () => {
            assert.deepEqual(
                reducer({
                    ...initialState,
                    mode: selection.selectionModes.select,
                }, {
                    type: selection.SELECTION_EXECUTE,
                    payload: [{ id: 1 }],
                }),
                {
                    ...initialState,
                    mode: selection.selectionModes.select,
                    selectedItems: [{ id: 1 }],
                },
            );
        });

        it('should remove items on executing selection action if selection mode is deselect', () => {
            assert.deepEqual(
                reducer({
                    ...initialState,
                    mode: selection.selectionModes.deselect,
                    selectedItems: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
                }, {
                    type: selection.SELECTION_EXECUTE,
                    payload: [{ id: 1 }],
                }),
                {
                    ...initialState,
                    mode: selection.selectionModes.deselect,
                    selectedItems: [{ id: 2 }, { id: 3 }, { id: 4 }],
                },
            );
        });

        it('should include item in empty selected list', () => {
            assert.deepEqual(
                reducer(undefined, {
                    type: selection.SELECT_ITEMS,
                    payload: [{ id: 1 }],
                }),
                { ...initialState, selectedItems: [{ id: 1 }] },
            );
        });

        it('should include item in selected list at first position', () => {
            assert.deepEqual(
                reducer({
                    ...initialState,
                    selectedItems: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
                }, {
                    type: selection.SELECT_ITEMS,
                    payload: [{ id: 9 }],
                }),
                {
                    ...initialState,
                    selectedItems: [
                        { id: 9 }, { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
                },
            );
        });

        it('should not include item in selected list if it is already there', () => {
            assert.deepEqual(
                reducer({
                    ...initialState,
                    selectedItems: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
                }, {
                    type: selection.SELECT_ITEMS,
                    payload: [{ id: 3 }],
                }),
                { ...initialState, selectedItems: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] },
            );
        });

        it('should include items in empty selected list in reverse order', () => {
            assert.deepEqual(
                reducer(undefined, {
                    type: selection.SELECT_ITEMS,
                    payload: [{ id: 1 }, { id: 2 }, { id: 2 }, { id: 4 }],
                }),
                { ...initialState, selectedItems: [{ id: 4 }, { id: 2 }, { id: 1 }] },
            );
        });

        it('should include non repeated items in selected list in reverse order', () => {
            assert.deepEqual(
                reducer({
                    ...initialState,
                    selectedItems: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
                }, {
                    type: selection.SELECT_ITEMS,
                    payload: [{ id: 5 }, { id: 2 }, { id: 8 }, { id: 5 }],
                }),
                {
                    ...initialState,
                    selectedItems: [
                        { id: 8 }, { id: 5 }, { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 },
                    ],
                },
            );
        });

        it('should remove item from selected list', () => {
            assert.deepEqual(
                reducer({
                    ...initialState,
                    selectedItems: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
                }, {
                    type: selection.DESELECT_ITEMS,
                    payload: [{ id: 1 }],
                }),
                { ...initialState, selectedItems: [{ id: 2 }, { id: 3 }, { id: 4 }] },
            );

            assert.deepEqual(
                reducer({
                    ...initialState,
                    selectedItems: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
                }, {
                    type: selection.DESELECT_ITEMS,
                    payload: [{ id: 3 }],
                }),
                { ...initialState, selectedItems: [{ id: 1 }, { id: 2 }, { id: 4 }] },
            );

            assert.deepEqual(
                reducer({
                    ...initialState,
                    selectedItems: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
                }, {
                    type: selection.DESELECT_ITEMS,
                    payload: [{ id: 9 }],
                }),
                { ...initialState, selectedItems: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] },
            );
        });

        it('should remove items from selected list', () => {
            assert.deepEqual(
                reducer({
                    ...initialState,
                    selectedItems: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
                }, {
                    type: selection.DESELECT_ITEMS,
                    payload: [{ id: 1 }, { id: 2 }, { id: 2 }, { id: 6 }, { id: 8 }],
                }),
                { ...initialState, selectedItems: [{ id: 3 }, { id: 4 }] },
            );
        });

        it('should delete all selected items if payload is empty', () => {
            assert.deepEqual(
                reducer(undefined, { type: selection.DESELECT_ITEMS }),
                { ...initialState, selectedItems: [] },
            );

            assert.deepEqual(
                reducer(
                    {
                        ...initialState,
                        selectedItems: [1, 2, 3],
                    },
                    { type: selection.DESELECT_ITEMS },
                ),
                { ...initialState, selectedItems: [] },
            );
        });

        it('should only accept positive buffer sizes', () => {
            assert.deepEqual(
                reducer(undefined, { type: selection.BUFFER_SIZE_CHANGE, payload: -1 }),
                initialState,
            );

            assert.deepEqual(
                reducer(undefined, { type: selection.HIGHLIGHT_BUFFER_SIZE_CHANGE, payload: -1 }),
                initialState,
            );
        });

        it('should do nothing on changing selection mode if new mode is not valid', () => {
            assert.deepEqual(
                reducer(undefined, { type: selection.SELECTION_MODE_CHANGE, payload: 99 }),
                initialState,
            );
        });

        it('should change selection mode with new valid selection mode', () => {
            assert.deepEqual(
                reducer(undefined, {
                    type: selection.SELECTION_MODE_CHANGE,
                    payload: selection.selectionModes.select,
                }),
                { ...initialState, mode: selection.selectionModes.select },
            );
        });
    });
});
