import React, { FunctionComponent } from 'react';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { makeStyles, Box, Typography, Grid } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
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
type Props = {
    params: ModuleParams;
};
const baseUrl = baseUrls.modules;
export const Modules: FunctionComponent<Props> = ({ params }) => {
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
                <Grid container spacing={1} justifyContent="flex-start">
                    <Grid item>
                        <HelpOutlineIcon />
                    </Grid>
                    <Grid>
                        <Typography variant="subtitle1">
                            {formatMessage(MESSAGES.modulesInformation)}
                        </Typography>
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
