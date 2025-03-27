import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRedirectTo, useRedirectToReplace } from 'bluesquare-components';
import { isEqual } from 'lodash';
import {
    useGetMultipleOrgUnits,
    useGetOrgUnit,
} from '../domains/orgUnits/components/TreeView/requests';
import { OrgUnit } from '../domains/orgUnits/types/orgUnit';

export type FilterState = {
    filters: Record<string, any>;
    handleSearch: () => void;
    handleChange: (keyValue: string, value: unknown) => void;
    changeAndSearch: (keyValue: string, value: unknown) => void;
    filtersUpdated: boolean;
    setFiltersUpdated: (updated: boolean) => void;
    setFilters: React.Dispatch<Record<string, any>>;
};

type FilterStateParams = {
    baseUrl: string;
    params: Record<string, unknown>;
    withPagination?: boolean;
    saveSearchInHistory?: boolean;
    searchActive?: string; // the key of the params used to activate search. If no such param exists, and the hook is used with a table, the table will load data onMount
    searchAlwaysEnabled?: boolean; // to be used with searchActive when we want to allow users to launch a search with empty filters
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

export const useFilterState = ({
    baseUrl,
    params,
    searchActive,
    withPagination = true,
    saveSearchInHistory = true,
    searchAlwaysEnabled = false,
}: FilterStateParams): FilterState => {
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const redirectTo = useRedirectTo();
    const redirectToReplace = useRedirectToReplace();
    const [filters, setFilters] = useState({
        ...removePaginationParams(params),
    });

    const handleSearch = useCallback(() => {
        if (filtersUpdated || searchAlwaysEnabled) {
            setFiltersUpdated(false);
            const tempParams = {
                ...params,
                ...filters,
            };
            if (withPagination) {
                tempParams.page = '1';
            }
            if (searchActive && Object.keys(params).includes(searchActive)) {
                tempParams[searchActive] = 'true';
            }
            if (saveSearchInHistory) {
                redirectTo(baseUrl, tempParams);
            } else {
                redirectToReplace(baseUrl, tempParams);
            }
        }
    }, [
        filtersUpdated,
        searchAlwaysEnabled,
        params,
        filters,
        withPagination,
        searchActive,
        saveSearchInHistory,
        redirectTo,
        baseUrl,
        redirectToReplace,
    ]);

    const updateFilters = useCallback(
        newFilters => {
            const initialFilterValue = removePaginationParams(params);
            if (!isEqual(newFilters, initialFilterValue)) {
                setFiltersUpdated(true);
            }
            if (isEqual(newFilters, initialFilterValue)) {
                setFiltersUpdated(false);
            }
            setFilters(newFilters);
        },
        [params],
    );

    const handleChange = useCallback(
        (key, value) => {
            const newFilters = {
                ...filters,
                [key]: value !== null ? value : undefined,
            };
            updateFilters(newFilters);
        },
        [filters, updateFilters],
    );

    const changeAndSearch = useCallback(
        (key, value) => {
            const newFilters = {
                ...filters,
                [key]: value !== null ? value : undefined,
            };
            const tempParams = { ...params, ...newFilters };
            if (withPagination) {
                tempParams.page = '1';
            }
            if (searchActive && Object.keys(params).includes(searchActive)) {
                tempParams[searchActive] = 'true';
            }
            if (saveSearchInHistory) {
                redirectTo(baseUrl, tempParams);
            } else {
                redirectToReplace(baseUrl, tempParams);
            }
        },
        [
            baseUrl,
            filters,
            params,
            redirectTo,
            redirectToReplace,
            saveSearchInHistory,
            searchActive,
            withPagination,
        ],
    );

    useEffect(() => {
        setFilters(removePaginationParams(params));
    }, [params]);

    return useMemo(() => {
        return {
            filters,
            handleChange,
            handleSearch,
            filtersUpdated,
            setFiltersUpdated,
            changeAndSearch,
            setFilters: updateFilters,
        };
    }, [
        filters,
        handleChange,
        handleSearch,
        filtersUpdated,
        changeAndSearch,
        updateFilters,
    ]);
};

type MultiTreeviewArgs = {
    paramIds: string | undefined;
    handleChange: (key: string, value: (string | number)[] | undefined) => void;
};

type MultiTreeviewFilter = {
    initialOrgUnits: OrgUnit[];
    handleOrgUnitChange: (orgUnits: (number | string)[] | undefined) => void;
};

export const useMultiTreeviewFilterState = ({
    paramIds,
    handleChange,
}: MultiTreeviewArgs): MultiTreeviewFilter => {
    const [initialOrgUnitIds, setInitialOrgUnitIds] = useState<
        string | (number | string)[] | undefined
    >(paramIds);
    const { data: initialOrgUnits } = useGetMultipleOrgUnits(initialOrgUnitIds);

    const handleOrgUnitChange = useCallback(
        orgUnits => {
            const ids = orgUnits ? orgUnits.map(orgUnit => orgUnit.id) : [];
            // When "emptying" the treeview, the value is [],
            // so we force it to undefined to avoid an empty string in the param org_unit which leads to a 404
            handleChange('org_unit', ids.length ? ids : undefined);
            setInitialOrgUnitIds(ids);
        },
        [handleChange],
    );

    return useMemo(
        () => ({ initialOrgUnits, handleOrgUnitChange }),
        [handleOrgUnitChange, initialOrgUnits],
    );
};

type TreeviewArgs = {
    paramId: string | undefined;
    handleChange: (key: string, value: (string | number)[] | undefined) => void;
};

type TreeviewFilter = {
    initialOrgUnit: OrgUnit;
    handleOrgUnitChange: (orgUnit: OrgUnit | undefined) => void;
};

export const useTreeviewFilterState = ({
    paramId,
    handleChange,
}: TreeviewArgs): TreeviewFilter => {
    const [initialOrgUnitId, setInitialOrgUnitId] = useState<
        string | (number | string)[] | undefined
    >(paramId);
    const { data: initialOrgUnit } = useGetOrgUnit(initialOrgUnitId);

    const handleOrgUnitChange = useCallback(
        orgUnit => {
            const id = orgUnit ? [orgUnit.id] : undefined;
            setInitialOrgUnitId(id);
            handleChange('org_unit', id);
        },
        [handleChange],
    );

    return useMemo(
        () => ({ initialOrgUnit, handleOrgUnitChange }),
        [handleOrgUnitChange, initialOrgUnit],
    );
};

type CheckBoxFilterArgs = {
    keyValue: string;
    handleChange: (key: string, value: boolean) => void;
    initialValue?: boolean;
};

type CheckBoxFilter = {
    handleCheckboxChange: (key: string, value: boolean) => void;
    checkBoxValue: boolean;
};

export const useCheckBoxFilter = ({
    keyValue,
    handleChange,
    initialValue = false,
}: CheckBoxFilterArgs): CheckBoxFilter => {
    const [checkBoxValue, setCheckBoxValue] = useState<boolean>(initialValue);

    const handleCheckboxChange = useCallback(
        (_key, value) => {
            handleChange(keyValue, !checkBoxValue);
            setCheckBoxValue(value);
        },
        [checkBoxValue, handleChange, keyValue],
    );

    return useMemo(() => {
        return {
            handleCheckboxChange,
            checkBoxValue,
        };
    }, [checkBoxValue, handleCheckboxChange]);
};
