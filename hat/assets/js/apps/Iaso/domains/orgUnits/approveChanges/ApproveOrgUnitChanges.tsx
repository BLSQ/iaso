import React, { FunctionComponent } from 'react';
import { Box, makeStyles } from '@material-ui/core';
import { commonStyles } from 'bluesquare-components';
import { ApproveOrgUnitChangesFilter } from './Filter/ApproveOrgUnitChangesFilter';
import { ApproveOrgUnitChangesTable } from './Table/ApproveOrgUnitChangesTable';
import { useGetApprovalProposals } from './hooks/api/useGetApprovalProposals';
import { Router } from '../../../types/general';
import TopBar from '../../../components/nav/TopBarComponent';

type Props = { router: Router };

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const ApproveOrgUnitChanges: FunctionComponent<Props> = ({ router }) => {
    const { data, isFetching } = useGetApprovalProposals();
    const classes: Record<string, string> = useStyles();
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
