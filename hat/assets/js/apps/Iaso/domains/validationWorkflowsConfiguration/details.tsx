import React, { useCallback } from 'react';
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
import { useGetWorkflowDetails } from 'Iaso/domains/validationWorkflowsConfiguration/api/Get';
import { useSaveNodeOrder } from 'Iaso/domains/validationWorkflowsConfiguration/api/PostPutPatch';
import { useWorkflowNodesColumns } from 'Iaso/domains/validationWorkflowsConfiguration/config';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { AddNode } from './components/CreateEditNode/CreateEditNode';
import { WorkflowBaseInfo } from './components/WorkflowBaseInfo';
import { useSortableTableState } from './hooks/useSortableTableState';
import MESSAGES from './messages';

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

export const ValidationWorkflowConfigurationDetail = () => {
    const params = useParamsObject(
        baseUrls.validationWorkflowsConfigurationDetail,
    );
    const goBack = useGoBack();
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const { data: workflow, isFetching: isLoading } = useGetWorkflowDetails(
        params.slug,
    );
    const {
        items,
        handleSortChange,
        handleResetOrder,
        isOrderChanged,
        setIsOrderChanged,
    } = useSortableTableState<Item>(workflow?.node_templates ?? []);
    const { mutateAsync: saveOrder } = useSaveNodeOrder(params.slug);
    const saveItems = useCallback(() => {
        const itemsForApi = items.map(item => ({
            ...item,
            roles_required: item.roles_required?.map(role => role.id),
        }));
        return saveOrder(itemsForApi).then(() => setIsOrderChanged(false));
    }, [items, saveOrder, setIsOrderChanged]);
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
                                sx={{ position: 'relative' }}
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
                    title={formatMessage(MESSAGES.steps)}
                >
                    <Box className={classes.count}>
                        {`${(workflow?.node_templates ?? []).length} `}
                        {formatMessage(MESSAGES.steps)}
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
                                onClick={saveItems}
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
