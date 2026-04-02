import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    LoadingSpinner,
    Table,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { Filters } from 'Iaso/domains/apiimports/components/Filters';
import { baseUrl } from 'Iaso/domains/apiimports/config';
import { useColumns } from 'Iaso/domains/apiimports/config';
import { useGetApiImports } from 'Iaso/domains/apiimports/hooks/requests';
import MESSAGES from 'Iaso/domains/apiimports/messages';
import { Params } from 'Iaso/domains/apiimports/types/filters';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const Apiimports: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as unknown as Params;
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const redirectTo = useRedirectTo();

    const { data, isFetching } = useGetApiImports(params);
    const columns = useColumns();
    return (
        <>
            {isFetching && <LoadingSpinner />}
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters params={params} />
                <Table
                    expanded={{}}
                    getObjectId={obj => obj.id}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'created_at', desc: true }]}
                    columns={columns}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                    onTableParamsChange={p => redirectTo(baseUrl, p)}
                />
            </Box>
        </>
    );
};
