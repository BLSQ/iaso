import React, { FunctionComponent } from 'react';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useDispatch } from 'react-redux';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useParams } from 'react-router-dom';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { baseUrls } from '../../constants/urls';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { ModuleParams } from './types/modules';
import { useGetModulesColumns } from './config';
import { useGetModules } from './hooks/requests/useGetModules';
import { redirectTo } from '../../routing/actions';
import { ModulesFilters } from './components/ModulesFilters';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const baseUrl = baseUrls.modules;
export const Modules: FunctionComponent = () => {
    const params = useParams() as unknown as ModuleParams;
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();

    const { data, isFetching } = useGetModules(params);
    const { formatMessage } = useSafeIntl();
    const columns = useGetModulesColumns();
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
                    extraProps={{ loading: isFetching }}
                    onTableParamsChange={p => dispatch(redirectTo(baseUrl, p))}
                    columnSelectorEnabled={false}
                />
            </Box>
        </>
    );
};
