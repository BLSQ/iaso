import React, { FunctionComponent } from 'react';
import {
    useSafeIntl,
    commonStyles,
    IconButton,
    LoadingSpinner,
} from 'bluesquare-components';
import { Box, Grid, makeStyles } from '@material-ui/core';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';

import { useGoBack } from '../../routing/useGoBack';
import { baseUrls } from '../../constants/urls';

import { useGetOrgUnit } from './hooks/useGetOrgUnit';
import { useGetEnketoUrl } from './hooks/useGetEnketoUrl';

import WidgetPaper from '../../components/papers/WidgetPaperComponent';
import { OrgUnitMap } from './components/OrgUnitMap';
import InstanceFileContent from '../instances/components/InstanceFileContent';

import EnketoIcon from '../instances/components/EnketoIcon';

type Params = {
    accountId: string;
    orgUnitId: string;
};

type Router = {
    goBack: () => void;
    params: Params;
};
type Props = {
    router: Router;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    paper: {
        width: '100%',
    },
    formContents: {
        maxHeight: '500px',
        overflow: 'auto',
    },
}));

// test org unit http://localhost:8081/dashboard/orgunits/detail/accountId/1/orgUnitId/104090/levels/126083,104133,104090/tab/infos
// ref instance http://localhost:8081/dashboard/forms/submission/accountId/1/instanceId/9813
export const Details: FunctionComponent<Props> = ({ router }) => {
    const { params } = router;
    const classes: Record<string, string> = useStyles();
    const { orgUnitId, accountId } = params;
    const { formatMessage } = useSafeIntl();
    const goBack = useGoBack(router, baseUrls.registry, { accountId });
    const { data: orgUnit, isFetching } = useGetOrgUnit(orgUnitId);
    const getEnketoUrl = useGetEnketoUrl(
        window.location.href,
        orgUnit?.reference_instance,
    );
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton
                goBack={() => goBack()}
            />
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                {isFetching && <LoadingSpinner />}
                <Grid container spacing={2}>
                    <Grid item xs={12} md={5}>
                        <WidgetPaper
                            className={classes.paper}
                            title={orgUnit?.name ?? ''}
                        >
                            <OrgUnitMap
                                orgUnit={orgUnit}
                                isLoading={isFetching}
                            />
                        </WidgetPaper>
                    </Grid>
                    {orgUnit?.reference_instance && (
                        <Grid
                            item
                            xs={12}
                            md={7}
                            alignItems="flex-start"
                            container
                        >
                            <WidgetPaper
                                id="form-contents"
                                className={classes.paper}
                                title={formatMessage(MESSAGES.submission)}
                                IconButton={IconButton}
                                iconButtonProps={{
                                    onClick: () => getEnketoUrl(),
                                    overrideIcon: EnketoIcon,
                                    color: 'secondary',
                                    tooltipMessage: MESSAGES.editOnEnketo,
                                }}
                            >
                                <Box className={classes.formContents}>
                                    <InstanceFileContent
                                        instance={orgUnit.reference_instance}
                                        showQuestionKey={false}
                                    />
                                </Box>
                            </WidgetPaper>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </>
    );
};
