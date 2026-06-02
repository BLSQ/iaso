import React from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, UrlParams, useSafeIntl } from 'bluesquare-components';
import { useApiAccountsList } from 'Iaso/api/accounts';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { SimpleTableWithDeepLink } from 'Iaso/components/tables/SimpleTableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { useAccountTableColumns } from 'Iaso/domains/accounts/config';
import { useApiParams } from 'Iaso/hooks/useApiParams';
import { useUrlParams } from 'Iaso/hooks/useUrlParams';
import {
    ParamsWithAccountId,
    useParamsObject,
} from 'Iaso/routing/hooks/useParamsObject';
import MESSAGES from './messages';

const useStyles = makeStyles((theme: any) => {
    return { ...commonStyles(theme) };
});
export const Accounts = () => {
    const params: ParamsWithAccountId & Partial<UrlParams> = useParamsObject(
        baseUrls.accounts,
    );

    const defaults = {
        order: 'name',
        pageSize: 20,
        page: 1,
    };

    const classes: Record<string, string> = useStyles();

    const safeParams = useUrlParams(params, defaults);
    const apiParams = useApiParams(safeParams);

    const { formatMessage } = useSafeIntl();
    const columns = useAccountTableColumns();
    const { data, isLoading } = useApiAccountsList(apiParams);

    return (
        <>
            <TopBar title={formatMessage(MESSAGES.accounts)} />
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                <SimpleTableWithDeepLink
                    params={params}
                    isFetching={isLoading}
                    baseUrl={baseUrls.accounts}
                    data={data}
                    columns={columns}
                />
            </Box>
        </>
    );
};
