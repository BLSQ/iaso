import React, { FunctionComponent, useMemo } from 'react';
import { TableToolbar } from 'bluesquare-components';
import {
    DownloadMenuButton,
    DownloadOption,
    useDownloadOption,
} from 'Iaso/components/DownloadMenuButton';
import {
    ColumnsSelectDrawer,
    Option,
} from 'Iaso/components/tables/ColumnSelectDrawer';
import { cleanupParams } from 'Iaso/utils/requests';
import { DEFAULT_VISIBLE_COLUMNS, tableDefaults } from '../hooks/useGetForms';
import { FormsParams } from '../types/forms';

type ColumnsSelect = {
    options: Option[];
    setOptions: (options: Option[]) => void;
    handleApplyOptions: () => void;
    isDisabled: boolean;
};

type Props = {
    count?: number;
    isLoading: boolean;
    params: FormsParams;
    columnsSelect: ColumnsSelect;
    displayColumnsSelectDrawer?: boolean;
    hasForms?: boolean;
};

const downloadBaseUrl = '/api/forms';

export const FormsTableToolbar: FunctionComponent<Props> = ({
    count,
    isLoading,
    params,
    columnsSelect,
    displayColumnsSelectDrawer = true,
    hasForms = false,
}) => {
    const downloadOption = useDownloadOption();

    const downloadOptions: DownloadOption[] = useMemo(() => {
        const {
            pageSize: _pageSize,
            page: _page,
            accountId: _accountId,
            isSearchActive: _isSearchActive,
            showDeleted,
            onlyDeleted,
            ...filterParams
        } = params as FormsParams & Record<string, string | undefined>;
        const downloadQueryString = new URLSearchParams(
            cleanupParams({
                ...filterParams,
                order: params.order ?? tableDefaults.order,
                show_deleted: showDeleted,
                only_deleted: onlyDeleted,
                fields: params.fields ?? DEFAULT_VISIBLE_COLUMNS.join(','),
            }),
        ).toString();
        return [
            downloadOption(
                'csv',
                `${downloadBaseUrl}/?${downloadQueryString}&csv=true`,
            ),
            downloadOption(
                'xlsx',
                `${downloadBaseUrl}/?${downloadQueryString}&xlsx=true`,
            ),
        ];
    }, [downloadOption, params]);

    return (
        <TableToolbar
            count={count}
            columnsSelect={
                displayColumnsSelectDrawer ? (
                    <ColumnsSelectDrawer
                        options={columnsSelect.options}
                        setOptions={columnsSelect.setOptions}
                        handleApplyOptions={columnsSelect.handleApplyOptions}
                        minColumns={2}
                        disabled={isLoading}
                        isDisabled={columnsSelect.isDisabled}
                        buttonType="icon"
                    />
                ) : undefined
            }
            download={
                downloadOptions.length > 0 ? (
                    <DownloadMenuButton
                        buttonType="icon"
                        options={downloadOptions}
                        disabled={isLoading || !hasForms}
                    />
                ) : undefined
            }
        />
    );
};
