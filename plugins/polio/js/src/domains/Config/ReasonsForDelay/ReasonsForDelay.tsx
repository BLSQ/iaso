import React, { FunctionComponent } from 'react';
import { Grid, Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { useUrlParams } from '../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { baseUrls } from '../../../constants/urls';
import { useStyles } from '../../../styles/theme';
import { CreateReasonForDelay } from './CreateEdit/CreateEditReasonForDelay';
import { useReasonsForDelayColumns } from './hooks/columns';
import { useReasonsForDelay } from './hooks/requests';
import MESSAGES from './messages';

const baseUrl = baseUrls.reasonsForDelayConfig;
export const ReasonsForDelay: FunctionComponent = () => {
    const params = useParamsObject(baseUrl);
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const columns = useReasonsForDelayColumns();
    const safeParams = useUrlParams(params, {
        order: 'id',
        pageSize: 10,
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
                />
                <Grid container item justifyContent="flex-end" xs={12}>
                    <CreateReasonForDelay iconProps={{}} />
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
                    columnSelectorEnabled={false}
                />
            </Box>
        </>
    );
};
