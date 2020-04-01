import {
  SET_MAPPING_VERSIONS,
  SET_CURRENT_MAPPING_VERSION,
  SET_CURRENT_FORM_VERSION,
  FETCHING_MAPPING_VERSIONS
} from "./actions";

export const mappingsInitialState = {
  current: null,
  mappingVersions: [],
  fetching: false,
  count: 0,
  pages: 1
};

export const mappingReducer = (state = mappingsInitialState, action = {}) => {
  switch (action.type) {
    case SET_MAPPING_VERSIONS: {
      const { mappingVersions, count, pages } = action.payload;
      return {
        ...state,
        mappingVersions,
        count,
        pages
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
    default:
      return state;
  }
};
