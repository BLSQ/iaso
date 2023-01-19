import React, { useState, useEffect, FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';

import { redirectToReplace } from '../../../routing/actions';

import {
    NewColumn,
    useGetInstancesColumns,
    useGetInstancesVisibleColumns,
} from '../utils';

import { ColumnsSelectDrawer } from '../../../components/tables/ColumnSelectDrawer';
import { INSTANCE_METAS_FIELDS } from '../constants';

import { VisibleColumn } from '../types/visibleColumns';
import { Form, PossibleField } from '../../forms/types/forms';
import { Column } from '../../../types/table';

type Params = {
    order?: string;
    showDeleted?: string;
    columns: string;
};
type Props = {
    params: Params;
    periodType?: string;
    // eslint-disable-next-line no-unused-vars
    setTableColumns: (newTableColumns: Column[]) => void;
    baseUrl: string;
    labelKeys: string[];
    possibleFields?: PossibleField[];
    formDetails: Form;
    tableColumns: Column[];
    formIds: string[];
};

const defaultOrder = 'updated_at';

export const ColumnSelect: FunctionComponent<Props> = ({
    params,
    periodType,
    setTableColumns,
    baseUrl,
    labelKeys,
    possibleFields,
    formDetails,
    tableColumns,
    formIds,
}) => {
    const dispatch = useDispatch();
    const [visibleColumns, setVisibleColumns] = useState<VisibleColumn[]>([]);
    const getInstancesVisibleColumns = useGetInstancesVisibleColumns({
        order: params.order,
        defaultOrder,
    });
    const getInstancesColumns = useGetInstancesColumns(
        params.showDeleted === 'true',
    );
    const handleChangeVisibleColmuns = (cols, withRedirect = true) => {
        const newTablecols = getInstancesColumns(cols);
        // TODO this part of the code should be refactored, it leads too infinite loop
        if (
            JSON.stringify(newTablecols) !== JSON.stringify(tableColumns) &&
            newTablecols.length > 1
        ) {
            setTableColumns(newTablecols);
        }
        setVisibleColumns(cols);
        if (withRedirect) {
            const columns = cols.filter(c => c.active);
            const newParams: Params = {
                ...params,
            };
            if (columns.length > 0) {
                newParams.columns = columns.map(c => c.key).join(',');
            }
            dispatch(redirectToReplace(baseUrl, newParams));
        }
    };

    useEffect(() => {
        let newColsString;
        if (params.columns) {
            newColsString = params.columns;
        } else {
            newColsString = INSTANCE_METAS_FIELDS.filter(
                f => Boolean(f.tableOrder) && f.active,
            ).map(f => f.accessor || f.key);
            if (formIds && formIds.length === 1) {
                newColsString = newColsString.filter(c => c !== 'form__name');
                if (periodType === null) {
                    newColsString = newColsString.filter(c => c !== 'period');
                }
            }
            newColsString = newColsString.join(',');
            if (labelKeys.length > 0) {
                newColsString = `${newColsString},${labelKeys.join(',')}`;
            }
        }
        let newCols: NewColumn[] = [];
        // single form
        if (formIds?.length === 1) {
            // if detail loaded
            if (formDetails) {
                newCols = getInstancesVisibleColumns(
                    possibleFields,
                    newColsString,
                );
            } else if (visibleColumns.length > 0) {
                // remove columns while reloading
                handleChangeVisibleColmuns([], false);
            }
            // multi forms
        } else {
            newCols = getInstancesVisibleColumns(undefined, newColsString);
        }
        if (newCols.length > 0) {
            handleChangeVisibleColmuns(newCols, false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [possibleFields, formDetails, formIds]);

    return (
        <ColumnsSelectDrawer
            options={visibleColumns}
            setOptions={cols => handleChangeVisibleColmuns(cols)}
        />
    );
};
