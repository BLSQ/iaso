import React, { FunctionComponent } from 'react';
import { useQueryClient } from 'react-query';
import { makeStyles } from '@mui/styles';
import { commonStyles } from 'bluesquare-components';
import { Box } from '@mui/material';
import { useOrgUnitsLogsColumns } from '../config';
import { LogsDetails } from './LogsDetails';
import { LOGS_PREFIX } from '../../../constants/urls';
import { useGetLogs } from '../../../hooks/useGetLogs';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { usePrefixedParams } from '../../../routing/hooks/usePrefixedParams';

type Props = {
    // eslint-disable-next-line no-unused-vars
    goToRevision: (revision: any, callback?: () => void) => void;
    logObjectId: number;
    baseUrl: string;
    params: Record<string, string>;
    defaultPageSize?: number;
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
                                goToRevision={revision => {
                                    goToRevision(revision, () => {
                                        queryClient.invalidateQueries([
                                            'logs',
                                            'iaso.orgunit',
                                            logObjectId,
                                        ]);
                                    });
                                }}
                            />
                        ) : null,
                }}
            />
        </Box>
    );
};
