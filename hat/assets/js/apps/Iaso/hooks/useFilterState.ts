import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
    useGetMultipleOrgUnits,
    useGetOrgUnit,
} from '../domains/orgUnits/components/TreeView/requests';
import { OrgUnit } from '../domains/orgUnits/types/orgUnit';
import { redirectTo, redirectToReplace } from '../routing/actions';

export type FilterState = {
    filters: Record<string, any>;
    handleSearch: () => void;
    // eslint-disable-next-line no-unused-vars
    handleChange: (keyValue: string, value: unknown) => void;
    filtersUpdated: boolean;
    // eslint-disable-next-line no-unused-vars
    setFiltersUpdated: (updated: boolean) => void;
};

type FilterStateParams = {
    baseUrl: string;
    params: Record<string, unknown>;
    withPagination?: boolean;
    saveSearchInHistory?: boolean;
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
    withPagination = true,
    saveSearchInHistory = true,
}: FilterStateParams): FilterState => {
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
            if (withPagination) {
                tempParams.page = '1';
            }
            if (saveSearchInHistory) {
                dispatch(redirectTo(baseUrl, tempParams));
            } else {
                dispatch(redirectToReplace(baseUrl, tempParams));
            }
        }
    }, [
        filtersUpdated,
        params,
        filters,
        withPagination,
        saveSearchInHistory,
        dispatch,
        baseUrl,
    ]);

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
        };
    }, [filters, handleChange, handleSearch, filtersUpdated]);
};

type MultiTreeviewArgs = {
    paramIds: string | undefined;
    // eslint-disable-next-line no-unused-vars
    handleChange: (key: string, value: (string | number)[] | undefined) => void;
};

type MultiTreeviewFilter = {
    initialOrgUnits: OrgUnit[];
    // eslint-disable-next-line no-unused-vars
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
    // eslint-disable-next-line no-unused-vars
    handleChange: (key: string, value: (string | number)[] | undefined) => void;
};

type TreeviewFilter = {
    initialOrgUnit: OrgUnit;
    // eslint-disable-next-line no-unused-vars
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
    // eslint-disable-next-line no-unused-vars
    handleChange: (key: string, value: boolean) => void;
    initialValue?: boolean;
};

type CheckBoxFilter = {
    // eslint-disable-next-line no-unused-vars
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
