import React, { FunctionComponent } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    commonStyles,
} from 'bluesquare-components';
import { Box, Grid, makeStyles } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import TopBar from '../../components/nav/TopBarComponent';
import { Infos } from './components/Infos';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';

import MESSAGES from './messages';

import { redirectToReplace } from '../../routing/actions';
import { baseUrls } from '../../constants/urls';

import WidgetPaper from '../../components/papers/WidgetPaperComponent';

import { StorageDetailsParams } from './types/storages';
import { useGetStorageLogs } from './hooks/requests/useGetStorageLogs';

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
    const { data: storageDetail, isFetching } = useGetStorageLogs(params);

    const classes: Record<string, string> = useStyles();
    const prevPathname: string | undefined = useSelector(
        (state: State) => state.routerCustom.prevPathname,
    );
    const dispatch = useDispatch();

    const columns = useGetDetailsColumns();
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
                        <TableWithDeepLink
                            marginTop={0}
                            showPagination={false}
                            elevation
                            baseUrl={baseUrls.storageDetail}
                            data={storageDetail?.logs ?? []}
                            pages={1}
                            defaultSorted={[
                                { id: 'performed_at', desc: false },
                            ]}
                            columns={columns}
                            count={0}
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
                    </WidgetPaper>
                </Box>
            </Box>
        </>
    );
};
