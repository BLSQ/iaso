import React, { useState } from 'react';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    useSafeIntl,
    commonStyles,
    AddButton,
    useRedirectTo,
} from 'bluesquare-components';
import { useFormsTableColumns } from './config';
import { Filters } from './components/Filters.tsx';
import DownloadButtonsComponent from '../../components/DownloadButtonsComponent.tsx';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { baseUrls } from '../../constants/urls.ts';
import * as Permission from '../../utils/permissions.ts';
import { useParamsObject } from '../../routing/hooks/useParamsObject.tsx';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink.tsx';
import { tableDefaults, useGetForms } from './hooks/useGetForms.tsx';
import { DisplayIfUserHasPerm } from '../../components/DisplayIfUserHasPerm.tsx';
import { useDeleteForm } from './hooks/useDeleteForm.tsx';
import { useRestoreForm } from './hooks/useRestoreForm.tsx';
import { cleanupParams } from '../../utils/requests';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const dwnldBaseUrl = '/api/forms';

const makeQueryString = params => {
    const searchParams = { ...cleanupParams(params) };
    // const keys = Object.keys(params);
    delete searchParams.searchActive;
    delete searchParams.accountId;
    if (params?.order === undefined) {
        searchParams.order = tableDefaults.order;
    }
    if (params?.page === undefined) {
        searchParams.page = tableDefaults.page;
    }
    if (params?.pageSize === undefined) {
        searchParams.limit = tableDefaults.limit;
    } else {
        searchParams.limit = params.pageSize;
    }
    delete searchParams.pageSize;
    searchParams.all = true;

    return new URLSearchParams(searchParams).toString();
};

const Forms = () => {
    const baseUrl = baseUrls.forms;
    const params = useParamsObject(baseUrl);
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const redirectTo = useRedirectTo();
    const [textSearchError, setTextSearchError] = useState(false);
    const { data: forms, isLoading: isLoadingForms } = useGetForms(
        params,
        params.searchActive === 'true',
    );

    const { mutateAsync: deleteForm } = useDeleteForm();
    const { mutateAsync: restoreForm } = useRestoreForm();

    const columns = useFormsTableColumns({
        deleteForm,
        restoreForm,
        showDeleted: params.showDeleted === 'true',
    });

    const csvUrl = `${dwnldBaseUrl}/?${makeQueryString(
        params,
    )}&all=true&csv=true`;
    const xlsxUrl = `${dwnldBaseUrl}/?${makeQueryString(
        params,
    )}&all=true&xlsx=true`;

    return (
        <>
            <TopBar title={formatMessage(MESSAGES.title)} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters
                    params={params}
                    onErrorChange={setTextSearchError}
                    hasErrors={textSearchError}
                />
                <Box mt={4}>
                    <Grid container spacing={2} justifyContent="flex-end">
                        <DisplayIfUserHasPerm permissions={[Permission.FORMS]}>
                            <AddButton
                                dataTestId="add-form-button"
                                onClick={() => {
                                    redirectTo(baseUrls.formDetail, {
                                        formId: '0',
                                    });
                                }}
                            />
                        </DisplayIfUserHasPerm>
                        <DownloadButtonsComponent
                            xlsxUrl={xlsxUrl}
                            csvUrl={csvUrl}
                            disabled={isLoadingForms || !forms?.forms?.length}
                        />
                    </Grid>
                </Box>
                <TableWithDeepLink
                    baseUrl={baseUrl}
                    defaultSorted={[{ id: 'instance_updated_at', desc: false }]}
                    columns={columns}
                    params={params}
                    data={forms?.forms ?? []}
                    count={forms?.count}
                    pages={forms?.pages}
                    extraProps={{ loading: isLoadingForms }}
                />
            </Box>
        </>
    );
};

export default Forms;
