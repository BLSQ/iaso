import { Box } from '@material-ui/core';
import React, { FunctionComponent } from 'react';

import {
    // @ts-ignore
    formatThousand,
    // @ts-ignore
    Table,
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

import { WorkflowParams, WorkflowVersionDetail } from '../types/workflows';
import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';

import { useGetFollowUpsColumns } from '../config';

type Props = {
    params: WorkflowParams;
    workflow: WorkflowVersionDetail;
    isLoading: boolean;
};

export const FollowUpsTable: FunctionComponent<Props> = ({
    params,
    workflow,
    isLoading,
}) => {
    const { entityTypeId, versionId } = params;
    const { formatMessage } = useSafeIntl();
    const followUpsColumns = useGetFollowUpsColumns(entityTypeId, versionId);

    return (
        <>
            <Table
                marginTop={false}
                countOnTop={false}
                elevation={0}
                showPagination={false}
                baseUrl={baseUrls.workflowDetail}
                data={workflow?.follow_ups ?? []}
                pages={1}
                defaultSorted={[
                    {
                        id: 'order',
                        desc: false,
                    },
                ]}
                columns={followUpsColumns}
                count={workflow?.follow_ups.length}
                params={params}
                extraProps={{
                    isLoading,
                }}
            />
            <Box display="flex" justifyContent="flex-end" pr={2} pb={2} mt={-2}>
                {`${formatThousand(workflow?.follow_ups.length ?? 0)} `}
                {formatMessage(MESSAGES.results)}
            </Box>
        </>
    );
};
