import React, {
    useEffect,
    FunctionComponent,
    useMemo,
    ReactNode,
    ReactElement,
} from 'react';
import { useSafeIntl, Column } from 'bluesquare-components';

import { useInstancesColumns, useInstanceVisibleColumns } from '../utils';

import { useGetPossibleFields } from '../../forms/hooks/useGetPossibleFields';

import { ColumnsSelectDrawer } from '../../../components/tables/ColumnSelectDrawer';

import { Form } from '../../forms/types/forms';

import MESSAGES from '../messages';
import { Instance } from '../types/instance';
import { useRedirectToReplace } from '../../../routing/routing';

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
    // eslint-disable-next-line no-unused-vars
    renderValue?: (form: Instance) => ReactNode;
    // eslint-disable-next-line no-unused-vars
    Cell?: (s: any) => ReactElement;
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
    instanceMetasFields?: InstanceMetasField[];
    // eslint-disable-next-line no-unused-vars
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
    getActionCell,
}) => {
    const { formatMessage } = useSafeIntl();
    const formIds = useMemo(
        () => (params.formIds ? params.formIds.split(',') : []),
        [params.formIds],
    );
    const formId = formIds?.length === 1 ? parseInt(formIds[0], 10) : undefined;
    const redirectToReplace = useRedirectToReplace();
    const { possibleFields } = useGetPossibleFields(formId);

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
            JSON.stringify(instancesColumns) !== JSON.stringify(tableColumns) &&
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
