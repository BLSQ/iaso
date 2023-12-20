import {
    Table,
    TableBody,
    TableCell,
    TableRow,
    useMediaQuery,
    useTheme,
    Box,
    Grid,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { FunctionComponent, useMemo } from 'react';
// @ts-ignore
import { useSafeIntl, Paginated } from 'bluesquare-components';
import classnames from 'classnames';
import WidgetPaperComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/papers/WidgetPaperComponent';
import MESSAGES from '../../../constants/messages';
import { BudgetStep, Categories, Transition } from '../types';
import { CreateBudgetStep } from '../CreateBudgetStep/CreateBudgetStep';
import { CreateOverrideStep } from '../CreateBudgetStep/CreateOverrideStep';
import { BudgetTimeline } from './BudgetTimeline';
import { userHasPermission } from '../../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';
import { useCurrentUser } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';

type NextSteps = {
    regular?: Transition[];
    toDisplay: Set<string>;
};

type Params = {
    campaignId: string;
    previousStep: string;
    quickTransition?: string;
};

type Props = {
    status: string;
    nextSteps?: NextSteps;
    categories?: Categories;
    budgetDetails?: Paginated<BudgetStep>;
    params: Params;
};

const useStyles = makeStyles(theme => ({
    paper: {
        backgroundColor: 'white',
        marginBottom: theme.spacing(2),
    },
    buttonContainer: {
        // @ts-ignore
        borderLeft: `1px solid ${theme.palette.ligthGray.border}`,
        // @ts-ignore
        borderBottom: `1px solid ${theme.palette.ligthGray.border}`,
    },
    buttonGrid: {
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),

        [theme.breakpoints.down('md')]: {
            justifyContent: 'center',
        },
    },
    leftCell: {
        // @ts-ignore
        borderRight: `1px solid ${theme.palette.ligthGray.border}`,
        fontWeight: 'bold',
    },
}));

export const BudgetDetailsInfos: FunctionComponent<Props> = ({
    status = '--',
    nextSteps,
    categories = [],
    budgetDetails,
    params,
}) => {
    const { previousStep, quickTransition, campaignId } = params;
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();
    const classes = useStyles();
    const currentUser = useCurrentUser();

    const isTabletOrDesktopLayout = useMediaQuery(theme.breakpoints.up('sm'));
    const isMobileLayout = useMediaQuery(theme.breakpoints.down('md'));

    const nextStepsToDisplay = nextSteps
        ? Array.from(nextSteps.toDisplay.values())
        : [];
    const [firstStep, ...steps] = nextStepsToDisplay;
    const previousBudgetStep = useMemo(() => {
        if (!quickTransition) return null;
        return (budgetDetails?.results ?? []).find(
            step => step.id === parseInt(previousStep, 10),
        );
    }, [budgetDetails?.results, previousStep, quickTransition]);

    return (
        <WidgetPaperComponent
            title={formatMessage(MESSAGES.budgetStatus)}
            className={classes.paper}
        >
            <Grid container spacing={0}>
                <Grid item xs={12} sm={4}>
                    <Table size={isMobileLayout ? 'small' : 'medium'}>
                        <TableBody>
                            <TableRow>
                                <TableCell className={classes.leftCell}>
                                    {formatMessage(MESSAGES.status)}
                                </TableCell>
                                <TableCell>{status}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell
                                    className={classnames(classes.leftCell)}
                                >
                                    {formatMessage(MESSAGES.nextSteps)}
                                </TableCell>
                                <TableCell>{firstStep}</TableCell>
                            </TableRow>
                            {steps?.length > 0 &&
                                steps.map(step => (
                                    <TableRow key={step}>
                                        <TableCell
                                            className={classnames(
                                                classes.leftCell,
                                            )}
                                        />
                                        <TableCell>{step}</TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </Grid>

                <Grid
                    item
                    xs={12}
                    sm={8}
                    container
                    spacing={0}
                    className={classes.buttonContainer}
                >
                    <Grid
                        item
                        xs={12}
                        container
                        spacing={isMobileLayout ? 1 : 2}
                        justifyContent="flex-end"
                        alignItems="center"
                        className={classes.buttonGrid}
                    >
                        {nextSteps && (
                            <>
                                {nextSteps.regular &&
                                    nextSteps.regular
                                        .filter(step => step.allowed)
                                        .map((step, index) => {
                                            const isQuickTransition =
                                                step.key === quickTransition;

                                            return (
                                                <Grid
                                                    item
                                                    // eslint-disable-next-line react/no-array-index-key
                                                    key={`${step.key}-${index}`}
                                                >
                                                    <CreateBudgetStep
                                                        isMobileLayout={
                                                            isMobileLayout
                                                        }
                                                        campaignId={campaignId}
                                                        iconProps={{
                                                            label: step.label,
                                                            // @ts-ignore
                                                            color: step.color,
                                                            disabled:
                                                                !step.allowed,
                                                        }}
                                                        transitionKey={step.key}
                                                        transitionLabel={
                                                            step.label
                                                        }
                                                        defaultOpen={
                                                            isQuickTransition
                                                        }
                                                        previousStep={
                                                            isQuickTransition
                                                                ? (previousBudgetStep as BudgetStep)
                                                                : undefined
                                                        }
                                                        requiredFields={
                                                            step.required_fields
                                                        }
                                                        params={params}
                                                        recipients={
                                                            step.emails_destination_team_ids
                                                        }
                                                    />
                                                </Grid>
                                            );
                                        })}
                                {userHasPermission(
                                    'iaso_polio_budget_admin',
                                    currentUser,
                                ) && (
                                    <Grid item>
                                        {/* Ignore missing iconProps as it's not really mandatory (typing error in the component) */}
                                        {/* @ts-ignore */}
                                        <CreateOverrideStep
                                            isMobileLayout={isMobileLayout}
                                            campaignId={campaignId}
                                            params={params}
                                        />
                                    </Grid>
                                )}
                            </>
                        )}
                    </Grid>
                </Grid>
            </Grid>
            {/* temporary hide the budget timeline waiting to fix the workflow process */}
            {isTabletOrDesktopLayout && (
                <Box py={2}>
                    <BudgetTimeline categories={categories} />
                </Box>
            )}
        </WidgetPaperComponent>
    );
};
