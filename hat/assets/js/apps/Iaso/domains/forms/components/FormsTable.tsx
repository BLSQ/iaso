import React, { FunctionComponent, useMemo } from 'react';
import { Box, Paper } from '@mui/material';
import {
    DownloadMenuButton,
    useDownloadOption,
} from 'Iaso/components/DownloadMenuButton';
import { SxStyles } from 'Iaso/types/general';
import { cleanupParams } from 'Iaso/utils/requests';
import { ColumnsSelectDrawer } from '../../../components/tables/ColumnSelectDrawer';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { usePrefixedParams } from '../../../routing/hooks/usePrefixedParams';
import { useFormsTableColumns } from '../config';
import { useColumnsSelectDrawer } from '../hooks/useColumnsSelectDrawer';
import {
    DEFAULT_VISIBLE_COLUMNS,
    tableDefaults,
    useGetForms,
} from '../hooks/useGetForms';
import { FormsParams } from '../types/forms';

type Props = {
    baseUrl: string;
    params: FormsParams;
    paramsPrefix?: string;
    tableDefaults?: { order?: string; limit?: number; page?: number };
    displayColumnsSelectDrawer?: boolean;
};

const downloadBaseUrl = '/api/forms';
const styles = {
    root: {
        marginTop: 2,
        position: 'relative',
    },
    toolbar: {
        position: 'absolute',
        top: theme => theme.spacing(1),
        left: theme => theme.spacing(2),
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
} satisfies SxStyles;
export const FormsTable: FunctionComponent<Props> = ({
    baseUrl,
    params,
    paramsPrefix,
    tableDefaults: tableDefaultsProp,
    displayColumnsSelectDrawer = true,
}) => {
    const apiParams = usePrefixedParams(paramsPrefix, params) as FormsParams;

    const downloadOption = useDownloadOption();
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

    const {
        options,
        setOptions,
        visibleColumns,
        handleApplyOptions,
        isDisabled,
    } = useColumnsSelectDrawer(columns, params, baseUrl);
    const downloadQueryString = useMemo(() => {
        // the export isn't paginated: only the filters, the order and the
        // visible columns are sent
        const {
            pageSize: _pageSize,
            page: _page,
            accountId: _accountId,
            isSearchActive: _isSearchActive,
            showDeleted,
            onlyDeleted,
            ...filterParams
        } = params as FormsParams & Record<string, string | undefined>;
        return new URLSearchParams(
            cleanupParams({
                ...filterParams,
                order: params.order ?? tableDefaults.order,
                show_deleted: showDeleted,
                only_deleted: onlyDeleted,
                fields: params.fields ?? DEFAULT_VISIBLE_COLUMNS.join(','),
            }),
        ).toString();
    }, [params]);
    const csvUrl = `${downloadBaseUrl}/?${downloadQueryString}&csv=true`;
    const xlsxUrl = `${downloadBaseUrl}/?${downloadQueryString}&xlsx=true`;
    const defaultLimit = tableDefaultsProp?.limit ?? tableDefaults.limit;
    return (
        <Paper sx={styles.root}>
            <Box sx={styles.toolbar}>
                {displayColumnsSelectDrawer && (
                    <ColumnsSelectDrawer
                        options={options}
                        setOptions={setOptions}
                        handleApplyOptions={handleApplyOptions}
                        minColumns={2}
                        disabled={isLoadingForms}
                        isDisabled={isDisabled}
                        buttonType="icon"
                    />
                )}
                <DownloadMenuButton
                    buttonType="icon"
                    options={[
                        downloadOption('csv', csvUrl),
                        downloadOption('xlsx', xlsxUrl),
                    ]}
                    disabled={isLoadingForms || !forms?.forms?.length}
                />
            </Box>
            <TableWithDeepLink
                elevation={0}
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
        </Paper>
    );
};
