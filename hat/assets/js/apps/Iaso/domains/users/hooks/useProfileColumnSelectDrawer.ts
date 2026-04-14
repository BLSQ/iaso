import React, { useCallback, useEffect, useMemo } from 'react';
import { useState } from 'react';
import { Column, useRedirectToReplace } from 'bluesquare-components';
import { Option } from 'Iaso/components/tables/ColumnSelectDrawer';
import { DEFAULT_PROFILE_COLUMNS } from 'Iaso/domains/users/hooks/useGetProfiles';

const HIDDEN_COLUMNS = ['actions', 'selection', 'user_id'];

export const useProfileColumnSelectDrawer = (
    columns: Column[],
    params: Record<string, any>,
    baseUrl: string,
) => {
    const getFieldParamValue = React.useCallback(
        (fields?: string): string[] => {
            const keys = fields ? fields.split(',') : DEFAULT_PROFILE_COLUMNS;
            return keys.filter(key => !HIDDEN_COLUMNS.includes(key));
        },
        [],
    );

    const [visibleColumnsKeys, setVisibleColumnsKeys] = useState<string[]>(
        getFieldParamValue(params?.fields),
    );

    useEffect(() => {
        setVisibleColumnsKeys(getFieldParamValue(params?.fields));
    }, [params.fields, getFieldParamValue]);

    const activeFieldKeys = useMemo(() => {
        return getFieldParamValue(params?.fields);
    }, [params.fields, getFieldParamValue]);

    const options = useMemo(() => {
        return columns
            .filter(column => {
                const key = (column.accessor || column.id) as string;
                return key && key !== 'actions' && key !== 'selection';
            })
            .map(column => {
                const key = (column.accessor || column.id) as string;
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
            const key = (column.accessor || column.id) as string;
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
        setOptions: setOptions as React.Dispatch<
            React.SetStateAction<Option[]>
        >,
        visibleColumns,
        handleApplyOptions,
        isDisabled,
    };
};
