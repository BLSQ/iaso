import React, { FunctionComponent } from 'react';
import { AddButton, useSafeIntl } from 'bluesquare-components';
import { Grid, Box } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import { useUrlParams } from '../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
import { useStyles } from '../../../styles/theme';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { redirectTo } from '../../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import { Router } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import MESSAGES from './messages';
import { useReasonsForDelay } from './hooks/requests';
import { CONFIG_REASONS_FOR_DELAY_URL } from '../../../constants/routes';
import { useReasonsForDelayColumns } from './hooks/columns';

type Props = { router: Router };

export const ReasonsForDelay: FunctionComponent<Props> = ({ router }) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const dispatch = useDispatch();
    const columns = useReasonsForDelayColumns();
    const safeParams = useUrlParams(router.params, {
        order: 'id',
        pageSize: 20,
        page: 1,
    });
    // TODO pass router params for table
    const { data, isFetching } = useReasonsForDelay(safeParams);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.reasonsForDelay)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid
                    container
                    spacing={0}
                    justifyContent="flex-end"
                    alignItems="center"
                    className={classes.marginTop}
                >
                    {/* <OrgUnitsTypesDialog
                        titleMessage={MESSAGES.create}
                        renderTrigger={({ openDialog }) => (
                            <AddButton
                                onClick={openDialog}
                                id="create-ou-type"
                            />
                        )}
                    /> */}
                </Grid>
                <TableWithDeepLink
                    marginTop={false}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    columns={columns}
                    count={data?.count ?? 0}
                    baseUrl={CONFIG_REASONS_FOR_DELAY_URL}
                    params={router.params}
                    extraProps={{ loading: isFetching }}
                    onTableParamsChange={p =>
                        dispatch(redirectTo(CONFIG_REASONS_FOR_DELAY_URL, p))
                    }
                    columnSelectorEnabled={false}
                />
            </Box>
        </>
    );
};
