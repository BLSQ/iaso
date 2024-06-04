import React, { FunctionComponent } from 'react';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { baseUrls } from '../../constants/urls';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { ModuleParams } from './types/modules';
import { useModulesColumns } from './config';
import { useGetModules } from './hooks/requests/useGetModules';
import { ModulesFilters } from './components/ModulesFilters';
import { useParamsObject } from '../../routing/hooks/useParamsObject';

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
                {/* @ts-ignore */}
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
                    columnSelectorEnabled={false}
                />
            </Box>
        </>
    );
};
