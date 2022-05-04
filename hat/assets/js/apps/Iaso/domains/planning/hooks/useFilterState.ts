import { useState, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { redirectTo } from '../../../routing/actions';

export type FilterState = {
    filters: Record<string, unknown>;
    handleSearch: () => void;
    // eslint-disable-next-line no-unused-vars
    handleChange: (keyValue: string, value: unknown) => void;
    filtersUpdated: boolean;
};

export const useFilterState = (
    baseUrl: string,
    params: Record<string, unknown>,
): FilterState => {
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const dispatch = useDispatch();
    const [filters, setFilters] = useState({
        ...params,
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
    }, [filtersUpdated, dispatch, filters, params]);

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
