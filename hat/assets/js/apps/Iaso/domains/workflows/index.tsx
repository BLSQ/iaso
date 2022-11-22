import React, { FunctionComponent, useMemo } from 'react';
// @ts-ignore
import { makeStyles, Box } from '@material-ui/core';
// @ts-ignore
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { useDispatch, useSelector } from 'react-redux';

import { baseUrls } from '../../constants/urls';

import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { WorkflowsParams } from './types/workflows';

import { useGetWorkflows } from './hooks/requests/useGetWorkflows';
import { useGetType } from '../entities/entityTypes/hooks/requests/entitiyTypes';

import { redirectToReplace } from '../../routing/actions';

import MESSAGES from './messages';
import { useGetColumns, defaultSorted, baseUrl } from './config';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));
// TODO: centralize those types
type RouterCustom = {
    prevPathname: string | undefined;
};
type State = {
    routerCustom: RouterCustom;
};
type Router = {
    goBack: () => void;
};
type Props = {
    params: WorkflowsParams;
    router: Router;
};

export const Workflows: FunctionComponent<Props> = ({ params, router }) => {
    const prevPathname = useSelector(
        (state: State) => state.routerCustom.prevPathname,
    );
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetWorkflows(params);
    const columns = useGetColumns();

    const { data: entityType } = useGetType(params.entityTypeId);
    const title = useMemo(
        () =>
            entityType
                ? `${entityType.name} - ${formatMessage(MESSAGES.workflows)}`
                : '',
        [entityType, formatMessage],
    );
    return (
        <>
            <TopBar
                title={title}
                displayBackButton
                goBack={() => {
                    if (prevPathname) {
                        router.goBack();
                    } else {
                        dispatch(redirectToReplace(baseUrls.entityTypes, {}));
                    }
                }}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <TableWithDeepLink
                    baseUrl={baseUrl}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={defaultSorted}
                    columns={columns}
                    count={data?.count ?? 0}
                    params={params}
                    onTableParamsChange={p =>
                        dispatch(redirectToReplace(baseUrl, p))
                    }
                    extraProps={{ loading: isFetching }}
                />
            </Box>
        </>
    );
};
