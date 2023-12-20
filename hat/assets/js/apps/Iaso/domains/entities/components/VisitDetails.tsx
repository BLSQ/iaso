import React, { FunctionComponent } from 'react';
import {
    useSafeIntl,
    LoadingSpinner,
    commonStyles,
} from 'bluesquare-components';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import InstanceFileContent from '../../instances/components/InstanceFileContent';
import { useGetVisitSubmission, useGetBeneficiary } from '../hooks/requests';
import { BeneficiaryBaseInfo } from './BeneficiaryBaseInfo';
import TopBar from '../../../components/nav/TopBarComponent';
import MESSAGES from '../messages';
import { redirectToReplace } from '../../../routing/actions';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import { baseUrls } from '../../../constants/urls';

type Props = {
    params: { instanceId: string; entityId: string };
    router: Record<string, any>;
};

const useStyles = makeStyles(theme => {
    return {
        ...commonStyles(theme),
    };
});

export const VisitDetails: FunctionComponent<Props> = ({ params, router }) => {
    const { instanceId, entityId } = params;
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data: submission, isLoading: isLoadingSubmission } =
        useGetVisitSubmission(instanceId);
    const { data: beneficiary, isLoading: isLoadingbeneficiary } =
        useGetBeneficiary(entityId);
    // @ts-ignore
    const prevPathname = useSelector(state => state.routerCustom.prevPathname);
    const dispatch = useDispatch();
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
                goBack={() => {
                    if (prevPathname) {
                        router.goBack();
                    } else {
                        dispatch(
                            redirectToReplace(baseUrls.entityDetails, {
                                entityId,
                            }),
                        );
                    }
                }}
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
