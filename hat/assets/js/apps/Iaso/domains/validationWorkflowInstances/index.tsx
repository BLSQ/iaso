import React from 'react';
import { makeStyles } from '@mui/styles';
import { Box } from '@mui/system';
// import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { commonStyles, UrlParams, useSafeIntl } from 'bluesquare-components';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { SimpleTableWithDeepLink } from 'Iaso/components/tables/SimpleTableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { ValidationWorkflowInstanceSearchFilterForm } from 'Iaso/domains/validationWorkflowInstances/components/ValidationWorkflowInstanceSearchFilterForm';
import { useValidationWorkflowInstanceSearchColumns } from 'Iaso/domains/validationWorkflowInstances/config';
import { useGetValidationWorkflowInstanceSearch } from 'Iaso/domains/validationWorkflowInstances/hooks/useGetValidationWorkflowInstanceSearch';
import {
    ParamsWithAccountId,
    useParamsObject,
} from 'Iaso/routing/hooks/useParamsObject';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import MESSAGES from './messages';

const useStyles = makeStyles((theme: any) => {
    return { ...commonStyles(theme) };
});

export const ValidationWorkflowInstanceSearch = () => {
    const currentUser = useCurrentUser();
    const params: ParamsWithAccountId & Partial<UrlParams> = useParamsObject(
        baseUrls.validationWorkflowInstances,
    );
    const { data, isLoading } = useGetValidationWorkflowInstanceSearch({
        params,
    });
    const columns = useValidationWorkflowInstanceSearchColumns({ currentUser });
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();

    return (
        <>
            <TopBar title={formatMessage(MESSAGES.title)} />
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                <ValidationWorkflowInstanceSearchFilterForm params={params} />
                <SimpleTableWithDeepLink
                    isFetching={isLoading}
                    data={data}
                    defaultSorted={[{ id: 'last_updated', desc: true }]}
                    columns={columns}
                    baseUrl={baseUrls.validationWorkflowInstances}
                    params={params}
                    extraProps={{
                        pageSize: params.pageSize,
                        search: params.search,
                    }}
                />
            </Box>
        </>
    );
};
