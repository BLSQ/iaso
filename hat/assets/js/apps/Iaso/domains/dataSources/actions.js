import { fetchAction } from '../../redux/actions/formsActions';

export const SET_ALL_SOURCES = 'SET_ALL_SOURCES';
export const SET_IS_FETCHING_SOURCES = 'SET_IS_FETCHING_SOURCES';

export const setAllDataSources = (list, { count, pages }) => ({
    type: SET_ALL_SOURCES,
    payload: {
        list,
        count,
        pages,
    },
});

export const setIsFetching = fetching => ({
    type: SET_IS_FETCHING_SOURCES,
    payload: fetching,
});

const apiKey = 'datasources';

export const fetchAllDataSources = params => dispatch =>
    fetchAction(
        dispatch,
        apiKey,
        setAllDataSources,
        'fetchDataSourcesError',
        'sources',
        params,
        setIsFetching,
    );
