import React, {
    FunctionComponent,
    ReactElement,
    ReactNode,
    useEffect,
    useMemo,
} from 'react';
import {
    Column,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import { ColumnsSelectDrawer } from '../../../components/tables/ColumnSelectDrawer';
import { useGetPossibleFields } from '../../forms/hooks/useGetPossibleFields';
import { Form } from '../../forms/types/forms';
import MESSAGES from '../messages';
import { Instance } from '../types/instance';
import { useInstanceVisibleColumns, useInstancesColumns } from '../utils';

type Params = {
    order?: string;
    showDeleted?: string;
    columns?: string;
    formIds?: string;
};

export type InstanceMetasField = {
    key: string;
    type: string;
    accessor?: string;
    active?: boolean;
    sortable?: boolean;
    tableOrder?: number;
    renderValue?: (form: Instance) => ReactNode;
    Cell?: (s: any) => ReactElement;
};

type Props = {
    params: Params;
    periodType?: string;
    setTableColumns: (newTableColumns: Column[]) => void;
    baseUrl: string;
    labelKeys: string[];
    formDetails: Form;
    tableColumns: Column[];
    disabled: boolean;
    instanceMetasFields?: InstanceMetasField[];
    appId?: string;
    getActionCell?: (settings: any) => ReactElement;
};

const defaultOrder = 'updated_at';

export const ColumnSelect: FunctionComponent<Props> = ({
    params,
    periodType,
    setTableColumns,
    baseUrl,
    labelKeys,
    formDetails,
    tableColumns,
    disabled = false,
    instanceMetasFields,
    appId,
    getActionCell,
}) => {
    const { formatMessage } = useSafeIntl();
    const formIds = useMemo(
        () => (params.formIds ? params.formIds.split(',') : []),
        [params.formIds],
    );
    const formId = formIds?.length === 1 ? parseInt(formIds[0], 10) : undefined;
    const redirectToReplace = useRedirectToReplace();
    const { possibleFields } = useGetPossibleFields(formId, appId);

    const visibleColumns = useInstanceVisibleColumns({
        formDetails,
        formIds,
        instanceMetasFields,
        labelKeys,
        columns: params.columns,
        periodType,
        possibleFields,
        order: params.order,
        defaultOrder,
    });

    const instancesColumns = useInstancesColumns(getActionCell, visibleColumns);

    const handleChangeVisibleColmuns = cols => {
        const columns = cols.filter(c => c.active);
        const newParams: Params = {
            ...params,
        };
        if (columns.length > 0) {
            newParams.columns = columns.map(c => c.key).join(',');
        }
        redirectToReplace(baseUrl, newParams);
    };

    useEffect(() => {
        if (
            JSON.stringify(
                instancesColumns.map(c => ({ accessor: c.accessor, id: c.id })),
            ) !==
                JSON.stringify(
                    tableColumns.map(c => ({ accessor: c.accessor, id: c.id })),
                ) &&
            instancesColumns.length > 1
        ) {
            setTableColumns(instancesColumns);
        }
    }, [instancesColumns, setTableColumns, tableColumns]);

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
