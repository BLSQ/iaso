import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { ReviewOrgUnitChangesFilter } from './Filter/ReviewOrgUnitChangesFilter';
import { ReviewOrgUnitChangesTable } from './Tables/ReviewOrgUnitChangesTable';
import { useGetApprovalProposals } from './hooks/api/useGetApprovalProposals';
import TopBar from '../../../components/nav/TopBarComponent';
import { ApproveOrgUnitParams } from './types';
import MESSAGES from './messages';
/*
# Org Unit Change Request

## Status:
There are 3 status:
- New → orange
- Approved → green
- Rejected → red

### If new:
- Left side: old org unit values (org unit values at request creation time). Comes from change request API (old_value field)
- Right side: proposed changes. Red if not selected, green if selected

### If approved:
- Left side: old org unit values (org unit values at request creation time). Comes from change request API (old_value field)
- Right side: proposed change → approved = green, rejected = red

### If rejected:
- Left side: old org unit values (org unit values at request creation time). Comes from change request API (old_value field)
- Right side: proposed changes in red

## Creation:

While creating a change request with the mobile app to create an org unit:
1. A change request is initiated with the validation_status set to "NEW".
2. The appropriate instance(s) are created.
3. The change request is created.

The org unit is assumed to be created with this change request.
The only validation performed is checking if the validation_status of the org unit is "NEW".

The mobile app and Django backend check for the existence of required fields (name, org unit type).
The frontend does not perform this check, as the API will reject the change request if these fields are missing.

When the org unit creation is approved, the status changes from "NEW" to "VALID".

The layout only shows new fields if the org unit is created using a change request, and all fields can either be approved or rejected in bulk.

Change requests to create an org unit should be highlighted in the table.

*/

type Props = { params: ApproveOrgUnitParams };

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const ReviewOrgUnitChanges: FunctionComponent<Props> = ({ params }) => {
    const { data, isFetching } = useGetApprovalProposals(params);
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <div>
            <TopBar title={formatMessage(MESSAGES.reviewChangeProposals)} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <ReviewOrgUnitChangesFilter params={params} />
                <ReviewOrgUnitChangesTable
                    data={data}
                    isFetching={isFetching}
                    params={params}
                />
            </Box>
        </div>
    );
};
