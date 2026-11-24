import React from 'react';
import { useGoBack, useSafeIntl } from 'bluesquare-components';
import { useApiValidationWorkflowsRetrieve } from 'Iaso/api/validationWorkflows/endpoints/validation-workflows/validation-workflows';

import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { SxStyles } from 'Iaso/types/general';
import { MainWrapper } from '../../components/MainWrapper';
import { WorkflowBreadcrumbs } from './components/WorkflowBreadcrumbs';
import { WorkflowEditor } from './components/WorkflowEditor';
import { WorkflowLinkedForms } from './components/WorkflowLinkedForms';
import MESSAGES from './messages';

const styles = {
    root: {
        backgroundColor: theme => theme.palette.primary.background,
        padding: { xs: 2, md: 4 },
    },
} satisfies SxStyles;

export const ValidationWorkflowConfigurationDetail = () => {
    const params = useParamsObject(
        baseUrls.validationWorkflowsConfigurationDetail,
    );
    const goBack = useGoBack();
    const { formatMessage } = useSafeIntl();
    const { data: workflow, isFetching: isLoading } =
        useApiValidationWorkflowsRetrieve(params.slug);

    const title = workflow?.name
        ? `${formatMessage(MESSAGES.configureInstancesValidation)}: ${workflow.name}`
        : formatMessage(MESSAGES.addInstancesValidationWorkflow);
    return (
        <>
            <TopBar title={title} goBack={goBack} displayBackButton />
            <MainWrapper sx={styles.root}>
                <WorkflowBreadcrumbs workflowName={workflow?.name} />
                {workflow && <WorkflowLinkedForms workflow={workflow} />}
                <WorkflowEditor workflow={workflow} isLoading={isLoading} />
            </MainWrapper>
        </>
    );
};
