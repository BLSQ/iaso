import React, { SyntheticEvent, useCallback } from 'react';
import { Box, Grid, Tab, Tabs, Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    LoadingSpinner,
    useGoBack,
    useSafeIntl,
} from 'bluesquare-components';
import { useApiValidationWorkflowsRetrieve } from 'Iaso/api/validationWorkflows';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { smallTabsOverrides } from 'Iaso/styles';
import { SxStyles } from 'Iaso/types/general';
import { MainWrapper } from '../../components/MainWrapper';
import { StepsEditor } from './components/StepsEditor/StepsEditor';
import { WorkflowBaseInfo } from './components/WorkflowBaseInfo';
import {
    getActiveTab,
    TabKey,
    useSelectWorkflowTab,
    WORKFLOW_TABS,
} from './detailsTabs';
import MESSAGES from './messages';

const styles = {
    tabs: {
        ...smallTabsOverrides,
        flexShrink: 0,
        marginBottom: 3,
    },
    root: {
        backgroundColor: theme => theme.palette.primary.background,
        padding: 4,
    },
} satisfies SxStyles;

const useStyles = makeStyles((theme: Theme) => {
    return {
        ...commonStyles(theme),
        infoPaper: {
            width: '100%',
            position: 'relative',
        },
        infoPaperBox: { minHeight: '100px' },
    };
});

export const ValidationWorkflowConfigurationDetail = () => {
    const params = useParamsObject(
        baseUrls.validationWorkflowsConfigurationDetail,
    );
    const goBack = useGoBack();
    const { formatMessage } = useSafeIntl();
    const activeTab = getActiveTab(params.tab);
    const selectTab = useSelectWorkflowTab();
    const handleChangeTab = useCallback(
        (_event: SyntheticEvent, tab: TabKey) => selectTab(tab),
        [selectTab],
    );
    const classes: Record<string, string> = useStyles();
    const { data: workflow, isFetching: isLoading } =
        useApiValidationWorkflowsRetrieve(params.slug);

    const title = workflow?.name
        ? `${formatMessage(MESSAGES.configureInstancesValidation)}: ${workflow.name}`
        : formatMessage(MESSAGES.addInstancesValidationWorkflow);
    return (
        <>
            <TopBar title={title} goBack={goBack} displayBackButton />
            <MainWrapper sx={styles.root}>
                <Tabs
                    value={activeTab}
                    onChange={handleChangeTab}
                    sx={styles.tabs}
                >
                    {WORKFLOW_TABS.map(({ key, label, Icon }) => (
                        <Tab
                            key={key}
                            value={key}
                            label={formatMessage(label)}
                            iconPosition="start"
                            icon={<Icon />}
                        />
                    ))}
                </Tabs>
                {activeTab === 'general' && (
                    <Box mb={2}>
                        <Grid container spacing={2} justifyContent="center">
                            <Grid container item xs={12} md={8} lg={6}>
                                <WidgetPaper
                                    className={classes.infoPaper}
                                    title={formatMessage(MESSAGES.infos)}
                                    sx={{ position: 'relative' }}
                                >
                                    <Box className={classes.infoPaperBox}>
                                        {isLoading && (
                                            <LoadingSpinner absolute />
                                        )}
                                        <WorkflowBaseInfo workflow={workflow} />
                                    </Box>
                                </WidgetPaper>
                            </Grid>
                        </Grid>
                    </Box>
                )}
                {activeTab === 'steps' && (
                    <StepsEditor workflow={workflow} isLoading={isLoading} />
                )}
            </MainWrapper>
        </>
    );
};
