import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRedirectToReplace, Column } from 'bluesquare-components';
import { Option } from '../../../components/tables/ColumnSelectDrawer';
import { OrgUnitParams } from '../types/orgUnit';
import { DEFAULT_ORG_UNIT_COLUMNS } from './requests/useGetOrgUnits';

const HIDDEN_COLUMNS = ['actions', 'selection'];

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
    const getCleanKeys = useCallback((fields?: string): string[] => {
        const keys = fields ? fields.split(',') : DEFAULT_ORG_UNIT_COLUMNS;
        return keys.filter(key => !HIDDEN_COLUMNS.includes(key));
    }, []);

    const [visibleColumnsKeys, setVisibleColumnsKeys] = useState<string[]>(
        getCleanKeys(params?.fields),
    );

    useEffect(() => {
        setVisibleColumnsKeys(getCleanKeys(params?.fields));
    }, [params.fields, getCleanKeys]);

    const activeFieldKeys = useMemo(() => {
        return getCleanKeys(params?.fields);
    }, [params.fields, getCleanKeys]);

    const options = useMemo(() => {
        return columns
            .filter(column => {
                const key = (column.id || column.accessor) as string;
                return key && key !== 'actions' && key !== 'selection';
            })
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
        return columns.filter(column => {
            const key = (column.id || column.accessor) as string;
            if (key === 'actions' || key === 'selection') {
                return true;
            }
            return activeFieldKeys.includes(key);
        });
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
