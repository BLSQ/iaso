import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';

import { useColumns } from './config';
import { useGetPipelines } from './hooks/useGetPipelines';
import { MESSAGES } from './messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const baseUrl = baseUrls.pipelineList;
export const PipelineList: FunctionComponent = () => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetPipelines();
    const defaultSorted = [{ id: 'id', desc: true }];

    const columns = useColumns();

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.pipelines)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                {/* @ts-ignore */}
                <TableWithDeepLink
                    baseUrl={baseUrl}
                    data={data ?? []}
                    pages={1}
                    showPagination={false}
                    defaultSorted={defaultSorted}
                    columns={columns}
                    count={data?.length ?? 0}
                    params={{}}
                    extraProps={{ loading: isFetching }}
                />
            </Box>
        </>
    );
};
