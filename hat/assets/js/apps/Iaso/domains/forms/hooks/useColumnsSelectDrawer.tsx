import { useState, useMemo, useCallback } from 'react';
import { useRedirectToReplace } from 'bluesquare-components';
import { Column } from 'bluesquare-components';
import { Option } from '../../../components/tables/ColumnSelectDrawer';
import { FormsParams } from '../types/forms';
import { DEFAULT_VISIBLE_COLUMNS } from './useGetForms';

export const useColumnsSelectDrawer = (
    columns: Column[],
    params: FormsParams,
    baseUrl: string,
): {
    options: Option[];
    setOptions: (options: Option[]) => void;
    visibleColumns: Column[];
    handleApplyOptions: () => void;
} => {
    const [visibleColumnsKeys, setVisibleColumnsKeys] = useState<string[]>(
        params?.fields?.split(',') ?? DEFAULT_VISIBLE_COLUMNS,
    );
    const options = useMemo(() => {
        return columns
            .filter(column => column.id && column.id !== 'actions')
            .map(column => ({
                key: column.id,
                label: column.Header,
                active: column.id && visibleColumnsKeys.includes(column.id),
                disabled: false,
            })) as Option[];
    }, [visibleColumnsKeys, columns]);
    const setOptions = useCallback((options: Option[]) => {
        setVisibleColumnsKeys(
            options.filter(option => option.active).map(option => option.key),
        );
    }, []);
    const fields = useMemo(() => {
        return [
            ...(params.fields?.split(',') ?? DEFAULT_VISIBLE_COLUMNS),
            'actions',
        ];
    }, [params.fields]);
    const visibleColumns = useMemo(() => {
        return columns.filter(
            column =>
                column.id === 'actions' ||
                (column.id && fields.includes(column.id)),
        );
    }, [columns, fields]);

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
    };
};
