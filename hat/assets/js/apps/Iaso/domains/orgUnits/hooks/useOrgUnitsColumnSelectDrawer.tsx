import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRedirectToReplace, Column } from 'bluesquare-components';
import { Option } from '../../../components/tables/ColumnSelectDrawer';
import { OrgUnitParams } from '../types/orgUnit';
import { DEFAULT_ORG_UNIT_COLUMNS } from './requests/useGetOrgUnits';

export const useOrgUnitsColumnSelectDrawer = (
    columns: Column[],
    params: OrgUnitParams,
    baseUrl: string,
): {
    options: Option[];
    setOptions: (options: Option[]) => void;
    visibleColumns: Column[];
    handleApplyOptions: () => void;
    isDisabled: boolean;
} => {
    const [visibleColumnsKeys, setVisibleColumnsKeys] = useState<string[]>(
        params?.fields?.split(',') ?? DEFAULT_ORG_UNIT_COLUMNS,
    );

    useEffect(() => {
        setVisibleColumnsKeys(
            params?.fields?.split(',') ?? DEFAULT_ORG_UNIT_COLUMNS,
        );
    }, [params.fields]);

    const activeFieldKeys = useMemo(() => {
        return params?.fields?.split(',') ?? DEFAULT_ORG_UNIT_COLUMNS;
    }, [params.fields]);

    const options = useMemo(() => {
        return columns
            .filter(
                column =>
                    (column.id || column.accessor) && column.id !== 'actions',
            )
            .map(column => {
                const key = (column.id || column.accessor) as string;
                return {
                    key,
                    label: column.Header || key,
                    active: visibleColumnsKeys.includes(key),
                    disabled: false,
                };
            }) as Option[];
    }, [columns, visibleColumnsKeys]);

    const setOptions = (newOptions: Option[]) => {
        setVisibleColumnsKeys(newOptions.filter(o => o.active).map(o => o.key));
    };

    const isDisabled = useMemo(() => {
        return (
            [...visibleColumnsKeys].sort().join(',') ===
            [...activeFieldKeys].sort().join(',')
        );
    }, [visibleColumnsKeys, activeFieldKeys]);

    const visibleColumns = useMemo(() => {
        return columns.filter(
            column =>
                column.id === 'actions' ||
                (column.id && activeFieldKeys.includes(column.id as string)) ||
                (column.accessor &&
                    activeFieldKeys.includes(column.accessor as string)),
        );
    }, [columns, activeFieldKeys]);

    const redirectToReplace = useRedirectToReplace();

    const handleApplyOptions = useCallback(() => {
        redirectToReplace(baseUrl, {
            ...params,
            fields: visibleColumnsKeys.join(','),
        });
    }, [params, redirectToReplace, visibleColumnsKeys, baseUrl]);

    return {
        options,
        setOptions,
        visibleColumns,
        handleApplyOptions,
        isDisabled,
    };
};
