import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRedirectToReplace, Column } from 'bluesquare-components';
// Adjust this import path if your ColumnSelectDrawer is located elsewhere relative to this hook
import { Option } from '../../../components/tables/ColumnSelectDrawer';
import { TeamParams } from '../types/team';

export const DEFAULT_TEAMS_COLUMNS = [
    'id',
    'color',
    'name',
    'project_details',
    'type',
    'users_details',
    'members_count',
];

const HIDDEN_COLUMNS = ['actions', 'selection'];

export const useTeamsColumnSelectDrawer = (
    columns: Column[],
    params: TeamParams & { fields?: string },
    baseUrl: string,
): {
    options: Option[];
    setOptions: (options: Option[]) => void;
    visibleColumns: Column[];
    handleApplyOptions: () => void;
    isDisabled: boolean;
} => {
    const getCleanKeys = useCallback((fields?: string): string[] => {
        const keys = fields ? fields.split(',') : DEFAULT_TEAMS_COLUMNS;
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
                return key && !HIDDEN_COLUMNS.includes(key);
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
            if (HIDDEN_COLUMNS.includes(key)) {
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
