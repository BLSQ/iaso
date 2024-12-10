import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { ModulesFilters } from './components/ModulesFilters';
import { useModulesColumns } from './config';
import { useGetModules } from './hooks/requests/useGetModules';
import MESSAGES from './messages';
import { ModuleParams } from './types/modules';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const baseUrl = baseUrls.modules;
export const Modules: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as unknown as ModuleParams;
    const classes: Record<string, string> = useStyles();

    const { data, isFetching } = useGetModules(params);
    const { formatMessage } = useSafeIntl();
    const columns = useModulesColumns();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid container alignContent="stretch" spacing={1}>
                    <Grid>
                        <HelpOutlineIcon />
                    </Grid>
                    <Grid item>
                        {formatMessage(MESSAGES.modulesInformation)}
                    </Grid>
                </Grid>
                <ModulesFilters params={params} />
                <TableWithDeepLink
                    marginTop={false}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    columns={columns}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                    extraProps={{ loading: isFetching, defaultPageSize: 100 }}
                    showPagination={false}
                    columnSelectorEnabled={false}
                />
            </Box>
        </>
    );
};
