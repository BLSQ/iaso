import React, { FunctionComponent, useMemo } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    getTableUrl,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import DownloadButtonsComponent from 'Iaso/components/DownloadButtonsComponent';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { Filters } from 'Iaso/domains/apiimports/components/Filters';
import { baseUrl, useColumns } from 'Iaso/domains/apiimports/config';
import {
    paramsToApiParams,
    useGetApiImports,
} from 'Iaso/domains/apiimports/hooks/requests';
import MESSAGES from 'Iaso/domains/apiimports/messages';
import { Params } from 'Iaso/domains/apiimports/types/filters';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const ApiImports: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as unknown as Params;
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    const { data, isFetching } = useGetApiImports(params);
    const columns = useColumns();

    const csv_params = useMemo(() => paramsToApiParams(params), [params]);
    const csv_url = getTableUrl('api_import/export_to_csv', csv_params);

    return (
        <>
            {isFetching && <LoadingSpinner />}
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters params={params} />
                <Box mb={2} display="flex" justifyContent="flex-end">
                    <DownloadButtonsComponent csvUrl={csv_url} />
                </Box>
                <TableWithDeepLink
                    expanded={{}}
                    getObjectId={obj => obj.id}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'created_at', desc: true }]}
                    columns={columns}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                />
            </Box>
        </>
    );
};
