import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { ReviewOrgUnitChangesFilter } from './Filter/ReviewOrgUnitChangesFilter';
import { ReviewOrgUnitChangesTable } from './Tables/ReviewOrgUnitChangesTable';
import { useGetApprovalProposals } from './hooks/api/useGetApprovalProposals';
import { Router } from '../../../types/general';
import TopBar from '../../../components/nav/TopBarComponent';
import { ApproveOrgUnitParams } from './types';
import MESSAGES from './messages';

type Props = { router: Router; params: ApproveOrgUnitParams };

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const ReviewOrgUnitChanges: FunctionComponent<Props> = ({
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
                <ReviewOrgUnitChangesFilter params={router.params} />
                <ReviewOrgUnitChangesTable
                    data={data}
                    isFetching={isFetching}
                    params={params}
                />
            </Box>
        </div>
    );
};
