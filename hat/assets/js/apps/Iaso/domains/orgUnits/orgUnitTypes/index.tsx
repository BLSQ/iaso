import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Column, commonStyles, useSafeIntl } from 'bluesquare-components';

import { useApiV2OrgunittypesList } from 'Iaso/api/orgUnitTypes';
import { useApiParams } from 'Iaso/hooks/useApiParams';
import { useUrlParams } from 'Iaso/hooks/useUrlParams';
import TopBar from '../../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';

import { baseUrls } from '../../../constants/urls';

import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import { OrgUnitTypesParams } from '../types/orgunitTypes';
import { Filters } from './components/Filters';
import { OrgUnitsTypesDialogAddButton } from './components/OrgUnitsTypesDialog';
import { useGetColumns } from './config/tableColumns';
import MESSAGES from './messages';

const baseUrl = baseUrls.orgUnitTypes;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const OrgUnitTypes: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as unknown as OrgUnitTypesParams;
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    const defaults = {
        order: 'name',
        pageSize: 20,
        page: 1,
    };
    const safeParams = useUrlParams(params, defaults);
    const apiParams = useApiParams(safeParams);

    const { data, isFetching } = useApiV2OrgunittypesList(apiParams);

    const columns: Column[] = useGetColumns();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.orgUnitsTypes)}
                displayBackButton={false}
            />

            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters params={params} baseUrl={baseUrl} />
                <Grid
                    container
                    spacing={0}
                    justifyContent="flex-end"
                    alignItems="center"
                    className={classes.marginTop}
                >
                    <OrgUnitsTypesDialogAddButton
                        titleMessage={MESSAGES.create}
                    />
                </Grid>
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
                />
            </Box>
        </>
    );
};

export default OrgUnitTypes;
