import React, { FunctionComponent } from 'react';
import { useSafeIntl, commonStyles, IconButton } from 'bluesquare-components';
import { Box, Grid, makeStyles } from '@material-ui/core';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';

import { useGoBack } from '../../routing/useGoBack';
import { baseUrls } from '../../constants/urls';

import { useGetOrgUnit } from './hooks/useGetOrgUnit';

import WidgetPaper from '../../components/papers/WidgetPaperComponent';
import { OrgUnitMap } from './components/OrgUnitMap';
import InstanceFileContent from '../instances/components/InstanceFileContent';

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
        height: '65vh',
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
    return (
        <>
            <TopBar title="TITLE" displayBackButton goBack={() => goBack()} />
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                <Grid container spacing={2}>
                    <Grid container item xs={12} md={5}>
                        <WidgetPaper
                            className={classes.paper}
                            title={formatMessage(MESSAGES.selectedOrgUnit)}
                        >
                            <OrgUnitMap
                                orgUnit={orgUnit}
                                isLoading={isFetching}
                            />
                        </WidgetPaper>
                    </Grid>
                    {orgUnit?.reference_instance && (
                        <Grid container item xs={12} md={7}>
                            <WidgetPaper
                                id="form-contents"
                                className={classes.paper}
                                title="TITLE 2"
                                IconButton={IconButton}
                                iconButtonProps={{
                                    onClick: () =>
                                        window.open(
                                            orgUnit.reference_instance.file_url,
                                            '_blank',
                                        ),
                                    icon: 'xml',
                                    color: 'secondary',
                                    tooltipMessage: MESSAGES.downloadXml,
                                }}
                            >
                                <Box className={classes.formContents}>
                                    <InstanceFileContent
                                        instance={orgUnit.reference_instance}
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
