import React, { useEffect, FunctionComponent, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useSafeIntl } from 'bluesquare-components';

import { redirectToReplace } from '../../../routing/actions';

import {
    useGetInstancesColumns,
    useGetInstancesVisibleColumns,
} from '../utils';

import { useGetPossibleFields } from '../../forms/hooks/useGetPossibleFields';

import { ColumnsSelectDrawer } from '../../../components/tables/ColumnSelectDrawer';
import { INSTANCE_METAS_FIELDS } from '../constants';

import { VisibleColumn } from '../types/visibleColumns';
import { Form } from '../../forms/types/forms';
import { Column } from '../../../types/table';

import MESSAGES from '../messages';

type Params = {
    order?: string;
    showDeleted?: string;
    columns: string;
    formIds: string;
};

type Props = {
    params: Params;
    periodType?: string;
    // eslint-disable-next-line no-unused-vars
    setTableColumns: (newTableColumns: Column[]) => void;
    baseUrl: string;
    labelKeys: string[];
    formDetails: Form;
    tableColumns: Column[];
    disabled: boolean;
};

const defaultOrder = 'updated_at';

const getDefaultCols = (
    formIds: string[],
    labelKeys: string[],
    periodType?: string,
): string => {
    let newCols: string[] = INSTANCE_METAS_FIELDS.filter(
        f => Boolean(f.tableOrder) && f.active,
    ).map(f => f.accessor || f.key);
    if (formIds && formIds.length === 1) {
        newCols = newCols.filter(c => c !== 'form__name');
        if (periodType === null) {
            newCols = newCols.filter(c => c !== 'period');
        }
    }
    let newColsString = newCols.join(',');
    if (labelKeys.length > 0) {
        newColsString = `${newColsString},${labelKeys.join(',')}`;
    }
    return newColsString;
};
export const ColumnSelect: FunctionComponent<Props> = ({
    params,
    periodType,
    setTableColumns,
    baseUrl,
    labelKeys,
    formDetails,
    tableColumns,
    disabled = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const formIds = useMemo(
        () => (params.formIds ? params.formIds.split(',') : []),
        [params.formIds],
    );
    const formId = useMemo(() => {
        return formIds?.length === 1 ? parseInt(formIds[0], 10) : undefined;
    }, [formIds]);
    const dispatch = useDispatch();
    const { possibleFields } = useGetPossibleFields(formId);
    const getInstancesVisibleColumns = useGetInstancesVisibleColumns({
        order: params.order,
        defaultOrder,
    });
    const getInstancesColumns = useGetInstancesColumns(
        params.showDeleted === 'true',
    );
    const handleChangeVisibleColmuns = cols => {
        const columns = cols.filter(c => c.active);
        const newParams: Params = {
            ...params,
        };
        if (columns.length > 0) {
            newParams.columns = columns.map(c => c.key).join(',');
        }
        dispatch(redirectToReplace(baseUrl, newParams));
    };

    const visibleColumns: VisibleColumn[] = useMemo(() => {
        const newColsString: string = params.columns
            ? params.columns
            : getDefaultCols(formIds, labelKeys, periodType);
        let newCols: VisibleColumn[] = [];
        // single form
        if (formIds?.length === 1) {
            // if detail loaded
            if (formDetails) {
                newCols = getInstancesVisibleColumns(
                    newColsString,
                    possibleFields,
                );
            }
            // multi forms
        } else {
            newCols = getInstancesVisibleColumns(newColsString);
        }
        return newCols;
    }, [
        formDetails,
        formIds,
        getInstancesVisibleColumns,
        labelKeys,
        params.columns,
        periodType,
        possibleFields,
    ]);
    useEffect(() => {
        const newTablecols = getInstancesColumns(visibleColumns);
        if (
            JSON.stringify(newTablecols) !== JSON.stringify(tableColumns) &&
            newTablecols.length > 1
        ) {
            setTableColumns(newTablecols);
        }
    }, [getInstancesColumns, setTableColumns, tableColumns, visibleColumns]);

    return (
        <ColumnsSelectDrawer
            disabledMessage={formatMessage(
                MESSAGES.disableColumnSelectionMessage,
            )}
            disabled={disabled}
            options={visibleColumns}
            setOptions={cols => handleChangeVisibleColmuns(cols)}
        />
    );
};
