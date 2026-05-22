import React, { FunctionComponent, useMemo } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, getTableUrl, useSafeIntl } from 'bluesquare-components';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import DownloadButtonsComponent from '../../../components/DownloadButtonsComponent';
import TopBar from '../../../components/nav/TopBarComponent';
import { ReviewOrgUnitChangesFilter } from './Filter/ReviewOrgUnitChangesFilter';
import { useGetApprovalProposals } from './hooks/api/useGetApprovalProposals';
import MESSAGES from './messages';
import { ReviewOrgUnitChangesTable } from './Tables/ReviewOrgUnitChangesTable';
import { ApproveOrgUnitParams } from './types';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const ReviewOrgUnitChanges: FunctionComponent = () => {
    const params = useParamsObject(
        baseUrls.orgUnitsChangeRequest,
    ) as unknown as ApproveOrgUnitParams;
    const { data, isFetching } = useGetApprovalProposals(params);
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const endPointUrl = 'orgunits/changes/export_to_csv';
    const csv_params = useMemo(
        () => ({
            parent_id: params.parent_id,
            groups: params.groups,
            org_unit_search: params.org_unit,
            org_unit_type_id: params.org_unit_type_id,
            status: params.status,
            order: params.order,
            created_at_after: params.created_at_after,
            created_at_before: params.created_at_before,
            forms: params.forms,
            users: params.userIds,
            user_roles: params.userRoles,
            with_location: params.withLocation,
            projects: params.projectIds,
            payment_status: params.paymentStatus,
            payment_ids: params.paymentIds,
            source_version_id: params.source_version_id,
            potential_payment_ids: params.potentialPaymentIds,
            data_source_synchronization_id:
                params.data_source_synchronization_id,
            ids: params.ids,
            is_soft_deleted: params.is_soft_deleted || false,
            requested_fields: params.requested_fields,
            kind: params.kind,
        }),
        [
            params.parent_id,
            params.groups,
            params.org_unit,
            params.org_unit_type_id,
            params.status,
            params.order,
            params.created_at_after,
            params.created_at_before,
            params.forms,
            params.userIds,
            params.userRoles,
            params.withLocation,
            params.projectIds,
            params.paymentStatus,
            params.paymentIds,
            params.source_version_id,
            params.potentialPaymentIds,
            params.data_source_synchronization_id,
            params.ids,
            params.is_soft_deleted,
            params.requested_fields,
            params.kind,
        ],
    );

    const csv_url = getTableUrl(endPointUrl, csv_params);

    return (
        <div>
            <TopBar title={formatMessage(MESSAGES.reviewChangeProposals)} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <ReviewOrgUnitChangesFilter params={params} />
                <Box mb={2} display="flex" justifyContent="flex-end">
                    <DownloadButtonsComponent csvUrl={csv_url} />
                </Box>

                <ReviewOrgUnitChangesTable
                    data={data}
                    isFetching={isFetching}
                    params={params}
                />
            </Box>
        </div>
    );
};
