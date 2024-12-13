import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    AddButton,
    Column,
    commonStyles,
    useSafeIntl,
} from 'bluesquare-components';
import React, { FunctionComponent } from 'react';

import TopBar from '../../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { OrgUnitsTypesDialog } from './components/OrgUnitsTypesDialog';

import { baseUrls } from '../../../constants/urls';
import { OrgUnitTypesParams } from '../types/orgunitTypes';
import MESSAGES from './messages';

import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import { Filters } from './components/Filters';
import { useGetColumns } from './config/tableColumns';
import { useGetOrgUnitTypes } from './hooks/useGetOrgUnitTypes';

const baseUrl = baseUrls.orgUnitTypes;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const OrgUnitTypes: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as unknown as OrgUnitTypesParams;
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const columns: Column[] = useGetColumns();
    const { data, isFetching } = useGetOrgUnitTypes({
        ...params,
        with_units_count: true,
    });
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
                    <OrgUnitsTypesDialog
                        titleMessage={MESSAGES.create}
                        renderTrigger={({ openDialog }) => (
                            <AddButton
                                onClick={openDialog}
                                id="create-ou-type"
                            />
                        )}
                    />
                </Grid>
                <TableWithDeepLink
                    marginTop={false}
                    data={data?.orgUnitTypes ?? []}
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
