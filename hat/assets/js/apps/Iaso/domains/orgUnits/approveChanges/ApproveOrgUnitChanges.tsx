import React, { FunctionComponent } from 'react';
import { Box, makeStyles } from '@material-ui/core';
import { commonStyles } from 'bluesquare-components';
import { ApproveOrgUnitChangesFilter } from './Filter/ApproveOrgUnitChangesFilter';
import { ApproveOrgUnitChangesTable } from './Table/ApproveOrgUnitChangesTable';
import { useGetApprovalProposals } from './hooks/api/useGetApprovalProposals';
import { Router } from '../../../types/general';
import TopBar from '../../../components/nav/TopBarComponent';
import { ApproveOrgUnitParams } from './types';

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
    console.log('data', data);
    return (
        <div>
            <TopBar />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <ApproveOrgUnitChangesFilter params={router.params} />
                <ApproveOrgUnitChangesTable />
            </Box>
        </div>
    );
};
