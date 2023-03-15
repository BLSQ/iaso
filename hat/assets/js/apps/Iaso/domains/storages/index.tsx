import React, { FunctionComponent } from 'react';
// @ts-ignore
import { makeStyles, Box } from '@material-ui/core';
// @ts-ignore
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { useDispatch } from 'react-redux';

import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { StorageParams } from './types/storages';
import { Filters } from './components/Filters';
import DownloadButtonsComponent from '../../components/DownloadButtonsComponent';
import { useGetStorages } from './hooks/requests/useGetStorages';
import { useGetStorageApiParams } from './hooks/requests/requests';
import { redirectToReplace } from '../../routing/actions';

import MESSAGES from './messages';
import { useGetColumns, defaultSorted, baseUrl } from './config';
import { useSingleTableParams } from '../../components/tables/SingleTable';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = {
    params: StorageParams;
};

export const Storages: FunctionComponent<Props> = ({ params }) => {
    const dispatch = useDispatch();
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
                    onTableParamsChange={p =>
                        dispatch(redirectToReplace(baseUrl, p))
                    }
                    extraProps={{ loading: isFetching }}
                />
            </Box>
        </>
    );
};
