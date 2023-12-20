import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { ApproveOrgUnitChangesFilter } from './Filter/ApproveOrgUnitChangesFilter';
import { ApproveOrgUnitChangesTable } from './Table/ApproveOrgUnitChangesTable';
import { useGetApprovalProposals } from './hooks/api/useGetApprovalProposals';
import { Router } from '../../../types/general';
import TopBar from '../../../components/nav/TopBarComponent';
import { ApproveOrgUnitParams } from './types';
import MESSAGES from './messages';

type Props = { router: Router; params: ApproveOrgUnitParams };

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const ApproveOrgUnitChanges: FunctionComponent<Props> = ({
    router,
    params,
}) => {
    const { data, isFetching } = useGetApprovalProposals(params);
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <div>
            <TopBar title={formatMessage(MESSAGES.reviewChangeProposals)} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <ApproveOrgUnitChangesFilter params={router.params} />
                <ApproveOrgUnitChangesTable
                    data={data}
                    isFetching={isFetching}
                    params={params}
                />
            </Box>
        </div>
    );
};
