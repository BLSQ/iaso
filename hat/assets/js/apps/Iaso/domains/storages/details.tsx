import React, { FunctionComponent } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    commonStyles,
} from 'bluesquare-components';
// @ts-ignore
import { Box, Divider, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useDispatch, useSelector } from 'react-redux';
import TopBar from '../../components/nav/TopBarComponent';
import { Infos } from './components/Infos';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import DownloadButtonsComponent from '../../components/DownloadButtonsComponent';

import MESSAGES from './messages';

import { redirectToReplace } from '../../routing/actions';
import { baseUrls } from '../../constants/urls';

import WidgetPaper from '../../components/papers/WidgetPaperComponent';
import { LogsFilters } from './components/LogsFilters';

import { StorageDetailsParams } from './types/storages';
import {
    useGetStorageLogs,
    useGetApiParams,
} from './hooks/requests/useGetStorageLogs';

import { useGetDetailsColumns } from './config';

type Props = {
    params: StorageDetailsParams;
    router: Router;
};
type State = {
    routerCustom: RouterCustom;
};
type RouterCustom = {
    prevPathname: string | undefined;
};

type Router = {
    goBack: () => void;
};
const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const Details: FunctionComponent<Props> = ({ params, router }) => {
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetStorageLogs(params);
    const { url: apiUrl } = useGetApiParams(params);

    const storageDetail = data?.results;

    const classes: Record<string, string> = useStyles();
    const prevPathname: string | undefined = useSelector(
        (state: State) => state.routerCustom.prevPathname,
    );
    const dispatch = useDispatch();

    const columns = useGetDetailsColumns();

    const storageDetailLogs = storageDetail?.logs ?? [];
    return (
        <>
            <TopBar
                title={`${formatMessage(MESSAGES.storage)}: ${
                    storageDetail ? storageDetail.storage_id : ''
                }`}
                displayBackButton
                goBack={() => {
                    if (prevPathname) {
                        router.goBack();
                    } else {
                        dispatch(redirectToReplace(baseUrls.storages, {}));
                    }
                }}
            />
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                <Grid container spacing={2}>
                    <Grid container item xs={4}>
                        <WidgetPaper title={formatMessage(MESSAGES.info)}>
                            <Infos storage={storageDetail} />
                        </WidgetPaper>
                    </Grid>
                </Grid>
                <Box mt={2}>
                    <WidgetPaper
                        className={classes.fullWith}
                        title={formatMessage(MESSAGES.logs)}
                    >
                        <Box position="relative">
                            <LogsFilters params={params} />
                            <Box mb={-4}>
                                <TableWithDeepLink
                                    marginTop={false}
                                    countOnTop={false}
                                    elevation={0}
                                    baseUrl={baseUrls.storageDetail}
                                    data={storageDetailLogs}
                                    pages={data?.pages}
                                    defaultSorted={[
                                        { id: 'performed_at', desc: false },
                                    ]}
                                    columns={columns}
                                    count={data?.count}
                                    params={params}
                                    onTableParamsChange={p =>
                                        dispatch(
                                            redirectToReplace(
                                                baseUrls.storageDetail,
                                                p,
                                            ),
                                        )
                                    }
                                    extraProps={{ loading: isFetching }}
                                />
                            </Box>
                            {storageDetailLogs.length > 0 && (
                                <>
                                    <Divider />
                                    <Box mb={2} mt={2}>
                                        <DownloadButtonsComponent
                                            csvUrl={`${apiUrl}&csv=true`}
                                            xlsxUrl={`${apiUrl}&xlsx=true`}
                                        />
                                    </Box>
                                </>
                            )}
                        </Box>
                    </WidgetPaper>
                </Box>
            </Box>
        </>
    );
};
