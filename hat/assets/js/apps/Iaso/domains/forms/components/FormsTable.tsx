import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { ColumnsSelectDrawer } from '../../../components/tables/ColumnSelectDrawer';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { usePrefixedParams } from '../../../routing/hooks/usePrefixedParams';
import { useFormsTableColumns } from '../config';
import { useColumnsSelectDrawer } from '../hooks/useColumnsSelectDrawer';
import { tableDefaults, useGetForms } from '../hooks/useGetForms';
import { FormsParams } from '../types/forms';
type Props = {
    baseUrl: string;
    params: FormsParams;
    paramsPrefix?: string;
    tableDefaults?: { order?: string; limit?: number; page?: number };
    displayColumnsSelectDrawer?: boolean;
};

export const FormsTable: FunctionComponent<Props> = ({
    baseUrl,
    params,
    paramsPrefix,
    tableDefaults: tableDefaultsProp,
    displayColumnsSelectDrawer = true,
}) => {
    console.log('displayColumnsSelectDrawer', displayColumnsSelectDrawer);
    const columns = useFormsTableColumns({
        showDeleted: params?.showDeleted === 'true',
        orgUnitId: params?.orgUnitId,
    });
    const apiParams = usePrefixedParams(paramsPrefix, params) as FormsParams;

    const { data: forms, isFetching: isLoadingForms } = useGetForms(
        apiParams,
        tableDefaultsProp
            ? { ...tableDefaults, ...tableDefaultsProp }
            : tableDefaults,
        true,
    );

    const {
        options,
        setOptions,
        visibleColumns,
        handleApplyOptions,
        isDisabled,
    } = useColumnsSelectDrawer(columns, params, baseUrl);

    const defaultLimit = tableDefaultsProp?.limit ?? tableDefaults.limit;
    return (
        <>
            {displayColumnsSelectDrawer && (
                <Box display="flex" justifyContent="flex-end" mt={2}>
                    <ColumnsSelectDrawer
                        options={options}
                        setOptions={setOptions}
                        handleApplyOptions={handleApplyOptions}
                        minColumns={2}
                        disabled={isLoadingForms}
                        isDisabled={isDisabled}
                    />
                </Box>
            )}
            <TableWithDeepLink
                baseUrl={baseUrl}
                defaultSorted={[{ id: 'name', desc: false }]}
                columns={visibleColumns}
                params={params}
                paramsPrefix={paramsPrefix}
                data={forms?.forms ?? []}
                count={forms?.count}
                pages={forms?.pages ?? 0}
                extraProps={{
                    loading: isLoadingForms,
                    defaultPageSize: forms?.limit ?? defaultLimit,
                    ...apiParams, // need to force render when these change to avoid desync between params and url
                }}
            />
        </>
    );
};
