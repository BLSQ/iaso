import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRedirectToReplace, Column } from 'bluesquare-components';
import { Option } from './index';

export const DEFAULT_HIDDEN_COLUMNS = ['actions', 'selection', 'expander'];

type Args = {
    columns: Column[];
    params: Record<string, any> & { fields?: string };
    baseUrl: string;
    defaultColumns: string[];
    hiddenColumns?: string[];
};

export type ColumnSelectDrawerResult = {
    options: Option[];
    setOptions: (options: Option[]) => void;
    visibleColumns: Column[];
    handleApplyOptions: () => void;
    isDisabled: boolean;
};

const getColumnKey = (column: Column): string =>
    (column.id || column.accessor) as string;

export const useColumnSelectDrawer = ({
    columns,
    params,
    baseUrl,
    defaultColumns,
    hiddenColumns = DEFAULT_HIDDEN_COLUMNS,
}: Args): ColumnSelectDrawerResult => {
    const defaultColumnsKey = defaultColumns.join(',');
    const hiddenColumnsKey = hiddenColumns.join(',');

    const getCleanKeys = useCallback(
        (fields?: string): string[] => {
            const keys = fields ? fields.split(',') : defaultColumnsKey.split(',');
            return keys.filter(key => !hiddenColumnsKey.split(',').includes(key));
        },
        [defaultColumnsKey, hiddenColumnsKey],
    );

    const [visibleColumnsKeys, setVisibleColumnsKeys] = useState<string[]>(
        getCleanKeys(params?.fields),
    );

    useEffect(() => {
        setVisibleColumnsKeys(getCleanKeys(params?.fields));
    }, [params.fields, getCleanKeys]);

    const activeFieldKeys = useMemo(
        () => getCleanKeys(params?.fields),
        [params.fields, getCleanKeys],
    );

    const options = useMemo(() => {
        const hidden = hiddenColumnsKey.split(',');
        return columns
            .filter(column => {
                const key = getColumnKey(column);
                return key && !hidden.includes(key);
            })
            .map(column => {
                const key = getColumnKey(column);
                return {
                    key,
                    label: column.Header || key,
                    active: visibleColumnsKeys.includes(key),
                    disabled: false,
                };
            }) as Option[];
    }, [columns, visibleColumnsKeys, hiddenColumnsKey]);

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
        const hidden = hiddenColumnsKey.split(',');
        return columns.filter(column => {
            const key = getColumnKey(column);
            if (hidden.includes(key)) {
                return true;
            }
            return activeFieldKeys.includes(key);
        });
    }, [columns, activeFieldKeys, hiddenColumnsKey]);

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
