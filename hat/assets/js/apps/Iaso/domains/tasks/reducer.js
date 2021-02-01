import {
    SET_CURRENT_TASK,
    SET_ALL_TASKS,
    SET_IS_FETCHING_TASKS,
} from './actions';

export const tasksInitialState = {
    list: [],
    fetching: true,
    count: 0,
    pages: 1,
};

export const tasksReducer = (state = tasksInitialState, action = {}) => {
    switch (action.type) {
        case SET_ALL_TASKS: {
            const { list, count = 0, pages = 1 } = action.payload;
            return {
                ...state,
                list,
                count,
                pages,
            };
        }
        case SET_CURRENT_TASK: {
            const currentTaskIndex = state.list.findIndex(
                t => t.id === action.payload.id,
            );

            const list = [
                ...state.list.slice(0, currentTaskIndex),
                action.payload,
                ...state.list.slice(currentTaskIndex + 1, state.list.length),
            ];

            return {
                ...state,
                list,
            };
        }
        case SET_IS_FETCHING_TASKS: {
            const fetching = action.payload;
            return { ...state, fetching };
        }
        default:
            return state;
    }
};
