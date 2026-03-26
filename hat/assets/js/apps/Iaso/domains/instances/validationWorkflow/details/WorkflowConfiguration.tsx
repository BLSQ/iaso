import React, { FunctionComponent } from 'react';
import { Box, Button, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    ColumnWithAccessor,
    commonStyles,
    Item,
    LoadingSpinner,
    SortableTable,
    useGoBack,
    useSafeIntl,
} from 'bluesquare-components';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import MESSAGES from '../../messages';
import { useGetWorkflowDetails } from '../api/Get';
import { useWorkflowNodesColumns } from '../columns';
import { useSortableTableState } from '../useSortableTableState';
import { AddNode } from './CreateEditNode/CreateEditNode';
import { WorkflowBaseInfo } from './WorkflowBaseInfo';

const useStyles = makeStyles((theme: any) => {
    return {
        ...commonStyles(theme),
        count: {
            height: theme.spacing(8),
            display: 'flex',
            justifyContent: 'flex-end',
            position: 'absolute',
            alignItems: 'center',
            paddingRight: theme.spacing(2),
            top: 0,
            right: 0,
        },
        titleRow: { fontWeight: 'bold' },
        infoPaper: {
            width: '100%',
            position: 'relative',
        },
        infoPaperBox: { minHeight: '100px' },
    };
});

export const WorkflowConfiguration: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.instanceValidationDetail);
    const goBack = useGoBack();
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const { data: workflow, isFetching: isLoading } = useGetWorkflowDetails(
        params.slug,
    );
    const { items, handleSortChange, handleResetOrder, isOrderChanged } =
        useSortableTableState<Item>(workflow?.nodeTemplates ?? []);
    const columns = useWorkflowNodesColumns(workflow?.slug);
    const title = workflow?.name
        ? `${formatMessage(MESSAGES.configureInstancesValidation)}: ${workflow.name}`
        : formatMessage(MESSAGES.addInstancesValidationWorkflow);
    return (
        <>
            <TopBar title={title} goBack={goBack} displayBackButton />
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                <Box mb={2}>
                    <Grid container spacing={2}>
                        <Grid container item xs={4}>
                            <WidgetPaper
                                className={classes.infoPaper}
                                title={formatMessage(MESSAGES.infos)}
                            >
                                <Box className={classes.infoPaperBox}>
                                    {isLoading && <LoadingSpinner absolute />}
                                    <WorkflowBaseInfo workflow={workflow} />
                                </Box>
                            </WidgetPaper>
                        </Grid>
                    </Grid>
                </Box>
                <WidgetPaper
                    className={classes.infoPaper}
                    title={formatMessage(MESSAGES.nodes)}
                >
                    <Box className={classes.count}>
                        {`${(workflow?.nodeTemplates ?? []).length} `}
                        {formatMessage(MESSAGES.nodes)}
                    </Box>
                    <SortableTable
                        items={items}
                        onChange={handleSortChange}
                        columns={columns as ColumnWithAccessor[]}
                    />
                    <Box m={2} textAlign="right">
                        <Box display="inline-block" mr={2}>
                            <Button
                                color="primary"
                                disabled={!isOrderChanged}
                                data-test="reset-follow-up-order"
                                onClick={handleResetOrder}
                                variant="contained"
                            >
                                {formatMessage(MESSAGES.resetOrder)}
                            </Button>
                        </Box>

                        <Box display="inline-block" mr={2}>
                            <Button
                                color="primary"
                                disabled={!isOrderChanged}
                                data-test="save-follow-up-order"
                                onClick={() => {}}
                                variant="contained"
                            >
                                {formatMessage(MESSAGES.saveOrder)}
                            </Button>
                        </Box>
                        <AddNode
                            workflowSlug={workflow?.slug ?? ''}
                            iconProps={{ disabled: !Boolean(workflow?.slug) }}
                        />
                    </Box>
                </WidgetPaper>
            </Box>
        </>
    );
};
