import React, { FunctionComponent, useMemo } from 'react';
import { Box } from '@mui/material';
import { Count } from 'bluesquare-components';
import {
    DownloadMenuButton,
    useDownloadOption,
} from 'Iaso/components/DownloadMenuButton';
import { SxStyles } from 'Iaso/types/general';
import { cleanupParams } from 'Iaso/utils/requests';
import {
    ColumnsSelectDrawer,
    Option,
} from '../../../components/tables/ColumnSelectDrawer';
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

const styles = {
    root: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 2,
        borderBottom: theme => `1px solid ${theme.palette.divider}`,
    },
    actions: {
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
    },
} satisfies SxStyles;

export const FormsTableToolbar: FunctionComponent<Props> = ({
    count,
    isLoading,
    params,
    columnsSelect,
    displayColumnsSelectDrawer = true,
    hasForms = false,
}) => {
    const downloadOption = useDownloadOption();

    const downloadQueryString = useMemo(() => {
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

    return (
        <Box sx={styles.root}>
            <Count count={count} />
            <Box sx={styles.actions}>
                {displayColumnsSelectDrawer && (
                    <ColumnsSelectDrawer
                        options={columnsSelect.options}
                        setOptions={columnsSelect.setOptions}
                        handleApplyOptions={columnsSelect.handleApplyOptions}
                        minColumns={2}
                        disabled={isLoading}
                        isDisabled={columnsSelect.isDisabled}
                        buttonType="icon"
                    />
                )}
                <DownloadMenuButton
                    buttonType="icon"
                    options={[
                        downloadOption(
                            'csv',
                            `${downloadBaseUrl}/?${downloadQueryString}&csv=true`,
                        ),
                        downloadOption(
                            'xlsx',
                            `${downloadBaseUrl}/?${downloadQueryString}&xlsx=true`,
                        ),
                    ]}
                    disabled={isLoading || !hasForms}
                />
            </Box>
        </Box>
    );
};
