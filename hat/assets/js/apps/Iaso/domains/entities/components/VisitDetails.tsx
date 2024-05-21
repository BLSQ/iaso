import React, { FunctionComponent } from 'react';
import {
    useSafeIntl,
    LoadingSpinner,
    commonStyles,
    useGoBack,
} from 'bluesquare-components';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import moment from 'moment';
import InstanceFileContent from '../../instances/components/InstanceFileContent';
import { useGetVisitSubmission, useGetBeneficiary } from '../hooks/requests';
import { BeneficiaryBaseInfo } from './BeneficiaryBaseInfo';
import TopBar from '../../../components/nav/TopBarComponent';
import MESSAGES from '../messages';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import { baseUrls } from '../../../constants/urls';
import { useParamsObject } from '../../../routing/hooks/useParamsObject';

const useStyles = makeStyles(theme => {
    return {
        ...commonStyles(theme),
    };
});

const baseUrl = baseUrls.entitySubmissionDetail;

export const VisitDetails: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as {
        instanceId: string;
        entityId: string;
    };
    const { instanceId, entityId } = params;
    const goBack = useGoBack(
        `${baseUrls.entityDetails}/entityId/${entityId}`,
        true,
    );
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data: submission, isLoading: isLoadingSubmission } =
        useGetVisitSubmission(instanceId);
    const { data: beneficiary, isLoading: isLoadingbeneficiary } =
        useGetBeneficiary(entityId);
    // Null checking beforehand because moment will return a date by default
    const visitDate =
        submission?.created_at &&
        moment.unix(submission.created_at).format('LTS');
    const baseTitle = submission?.form_name ?? formatMessage(MESSAGES.details);
    const title = visitDate ? `${baseTitle} - ${visitDate}` : baseTitle;
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.visitDetails)}
                displayBackButton
                goBack={goBack}
            />
            {/* @ts-ignore */}
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid container item spacing={4}>
                    {!isLoadingbeneficiary && (
                        <Grid item xs={4}>
                            <WidgetPaper
                                title={formatMessage(MESSAGES.beneficiary)}
                            >
                                <BeneficiaryBaseInfo
                                    beneficiary={beneficiary}
                                />
                            </WidgetPaper>
                        </Grid>
                    )}
                    {isLoadingbeneficiary && <LoadingSpinner absolute />}

                    <Grid item xs={8}>
                        {!isLoadingSubmission && (
                            <WidgetPaper title={title}>
                                <InstanceFileContent instance={submission} />
                            </WidgetPaper>
                        )}
                        {isLoadingSubmission && <LoadingSpinner absolute />}
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};
