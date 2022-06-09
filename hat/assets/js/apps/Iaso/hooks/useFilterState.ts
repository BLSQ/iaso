import { useState, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { redirectTo } from '../routing/actions';

export type FilterState = {
    filters: Record<string, unknown>;
    handleSearch: () => void;
    // eslint-disable-next-line no-unused-vars
    handleChange: (keyValue: string, value: unknown) => void;
    filtersUpdated: boolean;
};

const paginationParams = ['pageSize', 'page', 'order'];

const removePaginationParams = params => {
    const newParams = {
        ...params,
    };
    paginationParams.forEach(paramKey => {
        delete newParams[paramKey];
    });
    return newParams;
};

export const useFilterState = (
    baseUrl: string,
    params: Record<string, unknown>,
): FilterState => {
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const dispatch = useDispatch();
    const [filters, setFilters] = useState({
        ...removePaginationParams(params),
    });

    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const tempParams = {
                ...params,
                ...filters,
            };
            tempParams.page = '1';
            dispatch(redirectTo(baseUrl, tempParams));
        }
    }, [filtersUpdated, params, filters, dispatch, baseUrl]);

    const handleChange = useCallback(
        (key, value) => {
            setFiltersUpdated(true);
            setFilters({
                ...filters,
                [key]: value,
            });
        },
        [filters],
    );

    return useMemo(() => {
        return {
            filters,
            handleChange,
            handleSearch,
            filtersUpdated,
        };
    }, [filters, handleChange, handleSearch, filtersUpdated]);
};
