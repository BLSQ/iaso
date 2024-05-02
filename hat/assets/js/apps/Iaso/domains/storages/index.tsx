import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { StorageParams } from './types/storages';
import { Filters } from './components/Filters';
import DownloadButtonsComponent from '../../components/DownloadButtonsComponent';
import { useGetStorages } from './hooks/requests/useGetStorages';
import { useGetStorageApiParams } from './hooks/requests/requests';
import MESSAGES from './messages';
import { useGetColumns, defaultSorted, baseUrl } from './config';
import { useSingleTableParams } from '../../components/tables/SingleTable';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { baseUrls } from '../../constants/urls';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const Storages: FunctionComponent = () => {
    const params = useParamsObject(
        baseUrls.storages,
    ) as unknown as StorageParams;
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    const apiParams = useSingleTableParams(params);
    const { data, isFetching } = useGetStorages(apiParams);
    const { url: apiUrl } = useGetStorageApiParams(apiParams);
    const columns = useGetColumns(apiParams);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters params={apiParams} />
                <Box display="flex" justifyContent="flex-end" mt={2}>
                    <DownloadButtonsComponent
                        csvUrl={`${apiUrl}&csv=true`}
                        xlsxUrl={`${apiUrl}&xlsx=true`}
                        disabled={isFetching}
                    />
                </Box>
                <TableWithDeepLink
                    baseUrl={baseUrl}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={defaultSorted}
                    columns={columns}
                    count={data?.count ?? 0}
                    params={apiParams}
                    extraProps={{ loading: isFetching }}
                />
            </Box>
        </>
    );
};
