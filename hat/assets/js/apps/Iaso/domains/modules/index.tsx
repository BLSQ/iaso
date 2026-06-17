import React, { FunctionComponent } from 'react';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import moment from 'moment/moment';
import { getApiModulesListQueryKey, useApiModulesList } from 'Iaso/api/modules';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import TopBar from '../../components/nav/TopBarComponent';
import { ModulesFilters } from './components/ModulesFilters';
import { useModulesColumns } from './config';
import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const baseUrl = baseUrls.modules;
export const Modules: FunctionComponent = () => {
    const params = useParamsObject(baseUrl);
    const { search, ..._params } = params;
    const searchParams = React.useMemo(
        () => (search ? { search } : undefined),
        [search],
    );
    const classes: Record<string, string> = useStyles();

    const { data, isFetching } = useApiModulesList(searchParams, {
        query: {
            queryKey: [
                ...getApiModulesListQueryKey(searchParams),
                moment().locale(),
            ],
        },
    });

    const { formatMessage } = useSafeIntl();
    const columns = useModulesColumns();

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid
                    container
                    spacing={1}
                    sx={{
                        alignContent: 'stretch',
                    }}
                >
                    <Grid>
                        <HelpOutlineOutlinedIcon />
                    </Grid>
                    <Grid>{formatMessage(MESSAGES.modulesInformation)}</Grid>
                </Grid>
                <ModulesFilters params={searchParams} />
                <TableWithDeepLink
                    marginTop={false}
                    showPagination={false}
                    data={data ?? []}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    columns={columns}
                    count={data?.length ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                    extraProps={{ loading: isFetching }}
                    columnSelectorEnabled={false}
                />
            </Box>
        </>
    );
};
