import React, { FunctionComponent, useCallback } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles } from 'bluesquare-components';
import { useQueryClient } from 'react-query';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { LOGS_PREFIX } from '../../../constants/urls';
import { useGetLogs } from '../../../hooks/useGetLogs';
import { usePrefixedParams } from '../../../routing/hooks/usePrefixedParams';
import { useOrgUnitsLogsColumns } from '../config';
import { LogsDetails } from './LogsDetails';

type Props = {
    goToRevision: (revision: any, callback?: () => void) => void;
    logObjectId: number;
    baseUrl: string;
    params: Record<string, string>;
    defaultPageSize?: number;
    showButtons?: boolean;
};

const useStyles = makeStyles(theme => {
    return {
        containerFullHeightNoTabPadded:
            commonStyles(theme).containerFullHeightNoTabPadded,
    };
});

export const Logs: FunctionComponent<Props> = ({
    goToRevision,
    logObjectId,
    baseUrl,
    params,
    defaultPageSize = 10,
    showButtons = false,
}) => {
    const classes = useStyles();
    const queryClient = useQueryClient();
    const columns = useOrgUnitsLogsColumns();
    const tableParams = usePrefixedParams(LOGS_PREFIX, params);
    const { data, isFetching: loading } = useGetLogs({
        objectId: logObjectId,
        contentType: 'iaso.orgunit',
        params: tableParams,
    });
    const handleRevision = useCallback(
        revision => {
            goToRevision(revision, () => {
                queryClient.invalidateQueries([
                    'logs',
                    'iaso.orgunit',
                    logObjectId,
                ]);
            });
        },
        [goToRevision, logObjectId, queryClient],
    );
    return (
        <Box className={classes.containerFullHeightNoTabPadded}>
            <TableWithDeepLink
                baseUrl={baseUrl}
                params={tableParams}
                columns={columns}
                paramsPrefix={LOGS_PREFIX}
                data={data?.list ?? []}
                count={data?.count ?? 0}
                pages={data?.pages ?? 1}
                extraProps={{
                    loading,
                    defaultPageSize: data?.limit ?? defaultPageSize,
                    SubComponent: log =>
                        log ? (
                            <LogsDetails
                                logId={log.id}
                                goToRevision={handleRevision}
                                showButtons={showButtons}
                            />
                        ) : null,
                }}
            />
        </Box>
    );
};
