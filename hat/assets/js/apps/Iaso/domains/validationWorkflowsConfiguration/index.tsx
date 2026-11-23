import React from 'react';
import Add from '@mui/icons-material/Add';
import { Box, Paper, Theme, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    getOrderArray,
    LinkButton,
    TableToolbar,
    UrlParams,
    useSafeIntl,
} from 'bluesquare-components';
import { useApiValidationWorkflowsList } from 'Iaso/api/validationWorkflows';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { useApiParams } from 'Iaso/hooks/useApiParams';
import { useUrlParams } from 'Iaso/hooks/useUrlParams';
import {
    ParamsWithAccountId,
    useParamsObject,
} from 'Iaso/routing/hooks/useParamsObject';
import { SxStyles } from 'Iaso/types/general';
import { MainWrapper } from '../../components/MainWrapper';
import { Filters } from './components/Filters';
import { useWorkflowsTableColumns } from './config';
import MESSAGES from './messages';

const useStyles = makeStyles((theme: Theme) => {
    return { ...commonStyles(theme) };
});

const styles = {
    // Filters and create button on the same line, like the forms list
    toolbar: {
        display: 'flex',
        alignItems: 'center',
        gap: 2,
    },
    filters: {
        flexGrow: 1,
        minWidth: 0,
    },
    createButton: {
        flexShrink: 0,
    },
    description: {
        maxWidth: 480,
        my: 2,
    },
    root: {
        backgroundColor: theme => theme.palette.primary.background,
        padding: { xs: 2, md: 4 },
    },
} satisfies SxStyles;

// The table centres its column labels whatever the column `align`: keep them left like the
// cells, except the actions column (always the last one) which stays centred
const getTableStyles = (hasActions: boolean) => ({
    [`& .MuiTableHead-root .MuiTableCell-root${hasActions ? ':not(:last-of-type)' : ''}`]:
        {
            textAlign: 'left !important',
        },
});

const defaults = {
    order: 'name',
    pageSize: 20,
    page: 1,
};

export const ValidationWorkflowsConfiguration = () => {
    const params: ParamsWithAccountId & Partial<UrlParams> = useParamsObject(
        baseUrls.validationWorkflowsConfiguration,
    );
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const safeParams = useUrlParams(params, defaults);
    const { limit, page, ...apiParams } = useApiParams(safeParams);

    const { data: workflows, isLoading: isLoadingWorkflows } =
        useApiValidationWorkflowsList({
            limit: limit ? parseInt(limit) : undefined,
            page: page ? parseInt(page) : undefined,
            ...apiParams,
        });

    const columns = useWorkflowsTableColumns();
    const hasActions = columns.some(column => column.id === 'actions');
    return (
        <>
            <TopBar title={formatMessage(MESSAGES.validationWorkflows)} />

            <MainWrapper sx={styles.root}>
                <Box sx={styles.toolbar}>
                    <Box sx={styles.filters}>
                        <Filters params={params} />
                    </Box>
                    <Box sx={styles.createButton}>
                        <LinkButton
                            variant="contained"
                            color="primary"
                            size="medium"
                            target="_self"
                            to={`/${baseUrls.validationWorkflowsConfigurationDetail}/`}
                        >
                            <Add className={classes.buttonIcon} />
                            {formatMessage(MESSAGES.createWorkflow)}
                        </LinkButton>
                    </Box>
                </Box>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={styles.description}
                >
                    {formatMessage(MESSAGES.listDescription)}
                </Typography>
                <Paper sx={getTableStyles(hasActions)}>
                    <TableToolbar count={workflows?.count} />
                    <TableWithDeepLink
                        marginTop={false}
                        elevation={0}
                        baseUrl={baseUrls.validationWorkflowsConfiguration}
                        defaultSorted={getOrderArray(defaults.order)}
                        columns={columns}
                        params={params}
                        data={workflows?.results ?? []}
                        count={workflows?.count}
                        showCount={false}
                        pages={workflows?.pages ?? 0}
                        extraProps={{
                            loading: isLoadingWorkflows,
                            params,
                        }}
                    />
                </Paper>
            </MainWrapper>
        </>
    );
};
