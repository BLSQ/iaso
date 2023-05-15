import React, { FunctionComponent } from 'react';
import { Box, Grid, makeStyles } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import { commonStyles, AddButton, useSafeIntl } from 'bluesquare-components';

import TopBar from '../../../components/nav/TopBarComponent';
import { OrgUnitsTypesDialog } from './components/OrgUnitsTypesDialog';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';

import { OrgUnitTypesParams } from '../types/orgunitTypes';

import { useGetColumns } from './config/tableColumns';
import { baseUrls } from '../../../constants/urls';
import MESSAGES from './messages';

import { redirectTo } from '../../../routing/actions';

import { useGetOrgUnitTypes } from './hooks/useGetOrgUnitTypes';
import { Column } from '../../../types/table';

const baseUrl = baseUrls.orgUnitTypes;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));
type Props = {
    params: OrgUnitTypesParams;
};

const OrgUnitTypes: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const columns: Column[] = useGetColumns();
    const { data, isFetching } = useGetOrgUnitTypes(params);
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.orgUnitsTypes)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
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
                    onTableParamsChange={p => dispatch(redirectTo(baseUrl, p))}
                />
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
            </Box>
        </>
    );
};

export default OrgUnitTypes;
