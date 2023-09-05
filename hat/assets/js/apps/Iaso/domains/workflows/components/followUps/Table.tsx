import { Box } from '@material-ui/core';
import React, { FunctionComponent } from 'react';

import {
    // @ts-ignore => all files of utils are exported by default
    formatThousand,
    Table,
    useSafeIntl,
    Column,
} from 'bluesquare-components';

import { WorkflowParams, WorkflowVersionDetail } from '../../types';
import MESSAGES from '../../messages';
import { baseUrls } from '../../../../constants/urls';

type Props = {
    params: WorkflowParams;
    workflowVersion: WorkflowVersionDetail;
    isLoading: boolean;
    followUpsColumns: Array<Column>;
};

export const FollowUpsTable: FunctionComponent<Props> = ({
    params,
    workflowVersion,
    isLoading,
    followUpsColumns,
}) => {
    const { formatMessage } = useSafeIntl();

    return (
        <>
            <Table
                marginTop={false}
                countOnTop={false}
                elevation={0}
                showPagination={false}
                baseUrl={baseUrls.workflowDetail}
                data={workflowVersion?.follow_ups ?? []}
                pages={1}
                defaultSorted={[
                    {
                        id: 'order',
                        desc: false,
                    },
                ]}
                columns={followUpsColumns}
                count={workflowVersion?.follow_ups.length}
                params={params}
                extraProps={{
                    isLoading,
                    followUpsColumns,
                }}
            />
            <Box display="flex" justifyContent="flex-end" pr={2} pb={2} mt={-2}>
                {`${formatThousand(workflowVersion?.follow_ups.length ?? 0)} `}
                {formatMessage(MESSAGES.results)}
            </Box>
        </>
    );
};
