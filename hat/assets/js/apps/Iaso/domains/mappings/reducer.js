import {
    SET_MAPPING_VERSIONS,
    SET_CURRENT_MAPPING_VERSION,
    SET_CURRENT_FORM_VERSION,
    SET_CURRENT_QUESTION,
    SET_HESABU_DESCRIPTOR,
    FETCHING_MAPPING_VERSIONS,
    SET_MAPPING_SOURCES,
} from './actions';

export const mappingsInitialState = {
    current: null,
    currentFormVersion: null,
    currentQuestion: null,
    mappingVersions: [],
    hesabuDescriptor: null,
    fetching: false,
    count: 0,
    pages: 1,
};

export const mappingReducer = (state = mappingsInitialState, action = {}) => {
    switch (action.type) {
        case SET_MAPPING_VERSIONS: {
            const { mappingVersions, count, pages } = action.payload;
            return {
                ...state,
                mappingVersions,
                count,
                pages,
            };
        }

        case SET_CURRENT_MAPPING_VERSION: {
            const current = action.payload;
            return { ...state, current };
        }

        case FETCHING_MAPPING_VERSIONS: {
            const fetching = action.payload;
            return { ...state, fetching };
        }

        case SET_CURRENT_FORM_VERSION: {
            const currentFormVersion = action.payload;
            return { ...state, currentFormVersion };
        }

        case SET_CURRENT_QUESTION: {
            const currentQuestion = action.payload;
            return { ...state, currentQuestion };
        }

        case SET_HESABU_DESCRIPTOR: {
            const hesabuDescriptor = action.payload;
            return { ...state, hesabuDescriptor };
        }

        case SET_MAPPING_SOURCES: {
            const mappingSources = action.payload;
            return { ...state, mappingSources };
        }

        default:
            return state;
    }
};
