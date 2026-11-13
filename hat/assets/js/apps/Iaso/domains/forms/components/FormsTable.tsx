import React, { FunctionComponent, useMemo } from 'react';
import { Paper } from '@mui/material';
import { getOrderArray, useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { usePrefixedParams } from '../../../routing/hooks/usePrefixedParams';
import { useFormsTableColumns } from '../config';
import { useColumnsSelectDrawer } from '../hooks/useColumnsSelectDrawer';
import { tableDefaults, useGetForms } from '../hooks/useGetForms';
import MESSAGES from '../messages';
import { FormsParams } from '../types/forms';
import { FormsTableToolbar } from './FormsTableToolbar';

type Props = {
    baseUrl: string;
    params: FormsParams;
    paramsPrefix?: string;
    tableDefaults?: { order?: string; limit?: number; page?: number };
    displayColumnsSelectDrawer?: boolean;
};

const styles = {
    root: {
        marginTop: 2,
    },
} satisfies SxStyles;

export const FormsTable: FunctionComponent<Props> = ({
    baseUrl,
    params,
    paramsPrefix,
    tableDefaults: tableDefaultsProp,
    displayColumnsSelectDrawer = true,
}) => {
    const { formatMessage } = useSafeIntl();
    const apiParams = usePrefixedParams(paramsPrefix, params) as FormsParams;

    const { data: forms, isFetching: isLoadingForms } = useGetForms(
        apiParams,
        tableDefaultsProp
            ? { ...tableDefaults, ...tableDefaultsProp }
            : tableDefaults,
        true,
    );

    const columns = useFormsTableColumns({
        onlyDeleted: apiParams?.onlyDeleted === '1',
        showDeleted: apiParams?.showDeleted === '1',
        orgUnitId: params?.orgUnitId,
        params: apiParams,
        count: forms?.count ?? 0,
    });

    const columnWarnings = useMemo(
        () => ({
            instances_count: formatMessage(
                MESSAGES.instancesCountColumnWarning,
            ),
        }),
        [formatMessage],
    );

    const { visibleColumns, ...columnsSelect } = useColumnsSelectDrawer(
        columns,
        params,
        baseUrl,
        columnWarnings,
    );
    const defaultLimit = tableDefaultsProp?.limit ?? tableDefaults.limit;

    return (
        <Paper sx={styles.root}>
            <FormsTableToolbar
                count={forms?.count}
                isLoading={isLoadingForms}
                params={params}
                columnsSelect={columnsSelect}
                displayColumnsSelectDrawer={displayColumnsSelectDrawer}
                hasForms={Boolean(forms?.forms?.length)}
            />
            <TableWithDeepLink
                marginTop={false}
                elevation={0}
                baseUrl={baseUrl}
                defaultSorted={getOrderArray(
                    tableDefaultsProp?.order ?? tableDefaults.order,
                )}
                columns={visibleColumns}
                params={params}
                paramsPrefix={paramsPrefix}
                data={forms?.forms ?? []}
                count={forms?.count}
                showCount={false}
                pages={forms?.pages ?? 0}
                extraProps={{
                    loading: isLoadingForms,
                    defaultPageSize: forms?.limit ?? defaultLimit,
                    ...apiParams, // need to force render when these change to avoid desync between params and url
                }}
            />
        </Paper>
    );
};
