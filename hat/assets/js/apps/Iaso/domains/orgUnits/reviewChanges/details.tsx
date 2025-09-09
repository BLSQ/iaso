import React, {
    ChangeEvent,
    FunctionComponent,
    useMemo,
    useState,
} from 'react';
import { Box, FormControlLabel, Switch } from '@mui/material';
import {
    IconButton as IconButtonBlsq,
    useGoBack,
    useSafeIntl,
} from 'bluesquare-components';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { SxStyles } from 'Iaso/types/general';
import TopBar from '../../../components/nav/TopBarComponent';
import { ApproveOrgUnitChangesButtons } from './Components/ReviewOrgUnitChangesButtons';
import { ReviewOrgUnitChangesTitle } from './Components/ReviewOrgUnitChangesTitle';
import { CHANGE_REQUEST_STATUS, ORG_UNIT_CREATION } from './constants';
import { useGetApprovalProposal } from './hooks/api/useGetApprovalProposal';
import { useSaveChangeRequest } from './hooks/api/useSaveChangeRequest';
import { useNewFields } from './hooks/useNewFields';
import MESSAGES from './messages';
import { ReviewOrgUnitChangesDetailsTable } from './Tables/details/ReviewOrgUnitChangesDetailsTable';
import {
    ChangeRequestValidationStatus,
    OrgUnitChangeRequestDetailParams,
    OrgUnitChangeRequestDetails,
} from './types';

const styles: SxStyles = {
    container: theme => ({
        width: '100%',
        height: `calc(100vh - 65px)`,
        padding: theme.spacing(4),
        margin: 0,
        overflow: 'hidden',
        backgroundColor: 'white',
        [theme.breakpoints.down('md')]: {
            padding: theme.spacing(2),
        },
    }),
    body: theme => ({
        width: '100%',
        maxHeight: `calc(100vh - 200px)`,
        padding: 0,
        margin: 0,
        overflow: 'auto',
        border: `1px solid ${(theme.palette as any).border.main}`,
        borderRadius: 2,
    }),
};

const orgUnitAsChangeRequestDetailsOldValues = (
    changeRequest?: OrgUnitChangeRequestDetails,
): OrgUnitChangeRequestDetails | undefined => {
    if (changeRequest == null) {
        return undefined;
    }
    const orgUnit = changeRequest.org_unit
    return {
        ...changeRequest,
        old_closed_date: orgUnit?.closed_date,
        old_groups: orgUnit.groups,
        old_location: orgUnit.location,
        old_name: orgUnit.name,
        old_opening_date: orgUnit?.opening_date,
        old_org_unit_type: orgUnit.org_unit_type,
        old_parent: orgUnit.parent,
        old_reference_instances: orgUnit.reference_instances,
    };
};

export const ReviewOrgUnitChangesDetail: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();

    const [useValuesAtCreation, setUseValuesAtCreation] = useState(false);
    const params = useParamsObject(
        baseUrls.orgUnitsChangeRequestDetail,
    ) as unknown as OrgUnitChangeRequestDetailParams;

    const { data: changeRequest, isFetching: isFetchingChangeRequest } =
        useGetApprovalProposal(Number(params.changeRequestId));
    const isNew: boolean =
        !isFetchingChangeRequest &&
        changeRequest?.status === CHANGE_REQUEST_STATUS.NEW;
    const isNewOrgUnit = changeRequest
        ? changeRequest.kind === ORG_UNIT_CREATION
        : false;
    const data = useMemo(() => {
        if (useValuesAtCreation || !isNew) {
            return changeRequest;
        }
        return orgUnitAsChangeRequestDetailsOldValues(changeRequest);
    }, [changeRequest, useValuesAtCreation, isNew]);
    const { newFields, setSelected } = useNewFields(data);
    const goBack = useGoBack(baseUrls.orgUnitsChangeRequest);
    const titleMessage = useMemo(() => {
        if (changeRequest?.status === CHANGE_REQUEST_STATUS.REJECTED) {
            return formatMessage(MESSAGES.seeRejectedChanges);
        }
        if (changeRequest?.status === CHANGE_REQUEST_STATUS.APPROVED) {
            return formatMessage(MESSAGES.seeApprovedChanges);
        }
        if (isNewOrgUnit) {
            return formatMessage(MESSAGES.validateOrRejectNewOrgUnit);
        }
        return formatMessage(MESSAGES.validateOrRejectChanges);
    }, [changeRequest?.status, formatMessage, isNewOrgUnit]);
    const { mutate: submitChangeRequest, isLoading: isSaving } =
        useSaveChangeRequest(() => goBack(), Number(params.changeRequestId));

    return (
        <Box>
            <TopBar
                title={formatMessage(MESSAGES.reviewChangeProposal, {
                    name: changeRequest?.org_unit.name,
                })}
                goBack={goBack}
                displayBackButton
            />
            <Box sx={styles.container}>
                {!isFetchingChangeRequest && (
                    <ReviewOrgUnitChangesTitle
                        titleMessage={titleMessage}
                        changeRequest={changeRequest}
                        isFetchingChangeRequest={isFetchingChangeRequest}
                    />
                )}
                <Box sx={styles.body}>
                    {isNew && (
                        <FormControlLabel
                            control={
                                <Switch
                                    value={useValuesAtCreation}
                                    onChange={(
                                        event: ChangeEvent<HTMLInputElement>,
                                    ) =>
                                        setUseValuesAtCreation(
                                            event.target.checked,
                                        )
                                    }
                                />
                            }
                            label={formatMessage(MESSAGES.showValuesAtCreation)}
                            labelPlacement="start"
                        />
                    )}
                    <ReviewOrgUnitChangesDetailsTable
                        isSaving={isSaving}
                        changeRequest={data}
                        isFetchingChangeRequest={isFetchingChangeRequest}
                        newFields={newFields}
                        setSelected={setSelected}
                        isNewOrgUnit={isNewOrgUnit}
                    />
                </Box>

                <ApproveOrgUnitChangesButtons
                    newFields={newFields}
                    isNew={isNew}
                    submitChangeRequest={submitChangeRequest}
                    isNewOrgUnit={isNewOrgUnit}
                    changeRequest={changeRequest}
                />
            </Box>
        </Box>
    );
};

type PropsIcon = {
    changeRequestId: number;
    status: ChangeRequestValidationStatus;
};

export const IconButton: FunctionComponent<PropsIcon> = ({
    changeRequestId,
    status,
}) => {
    let message = MESSAGES.validateOrRejectChanges;
    if (status === 'rejected') {
        message = MESSAGES.seeRejectedChanges;
    }
    if (status === 'approved') {
        message = MESSAGES.seeApprovedChanges;
    }
    return (
        <IconButtonBlsq
            url={`/${baseUrls.orgUnitsChangeRequestDetail}/changeRequestId/${changeRequestId}`}
            tooltipMessage={message}
            size="small"
            icon={status === 'new' ? 'edit' : 'remove-red-eye'}
        />
    );
};
