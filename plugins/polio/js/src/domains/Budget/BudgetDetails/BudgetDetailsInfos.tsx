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
import { useSafeIntl, Paginated } from 'bluesquare-components';
import classnames from 'classnames';
import { DisplayIfUserHasPerm } from '../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import WidgetPaperComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/papers/WidgetPaperComponent';
import MESSAGES from '../../../constants/messages';
import { Budget, BudgetStep, Transition } from '../types';
import { CreateBudgetStep } from '../CreateBudgetStep/CreateBudgetStep';
import { CreateOverrideStep } from '../CreateBudgetStep/CreateOverrideStep';
import { BudgetTimeline } from './BudgetTimeline';
import { BUDGET_ADMIN } from '../../../constants/permissions';
import { formatRoundNumbers } from '../utils';

type NextSteps = {
    regular?: Transition[];
    toDisplay: Set<string>;
};

type Params = {
    previousStep?: string;
    quickTransition?: string;
};

type Props = {
    budgetProcess: Partial<Budget>;
    nextSteps?: NextSteps;
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
    budgetProcess = {},
    nextSteps,
    budgetDetails,
    params,
}) => {
    const status = budgetProcess?.current_state?.label;
    const rounds = budgetProcess?.rounds ?? [];
    const categories = budgetProcess?.timeline?.categories;

    const { previousStep, quickTransition } = params;
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();
    const classes = useStyles();

    const isTabletOrDesktopLayout = useMediaQuery(theme.breakpoints.up('sm'));
    const isMobileLayout = useMediaQuery(theme.breakpoints.down('md'));

    const nextStepsToDisplay = nextSteps
        ? Array.from(nextSteps.toDisplay.values())
        : [];
    const [firstStep, ...steps] = nextStepsToDisplay;
    const previousBudgetStep = useMemo(() => {
        if (!quickTransition || !previousStep) return null;
        return (budgetDetails?.results ?? []).find(
            step => step.id === parseInt(previousStep, 10),
        );
    }, [budgetDetails?.results, previousStep, quickTransition]);

    return (
        <WidgetPaperComponent
            title={`${formatRoundNumbers(rounds)} - ${formatMessage(
                MESSAGES.budgetStatus,
            )}`}
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
                                                        budgetProcessId={
                                                            budgetProcess?.id
                                                                ? `${budgetProcess.id}`
                                                                : undefined
                                                        }
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

                                <DisplayIfUserHasPerm
                                    permissions={[BUDGET_ADMIN]}
                                >
                                    <Grid item>
                                        {/* Ignore missing iconProps as it's not really mandatory (typing error in the component) */}
                                        {/* @ts-ignore */}
                                        <CreateOverrideStep
                                            isMobileLayout={isMobileLayout}
                                            budgetProcessId={
                                                budgetProcess?.id
                                                    ? `${budgetProcess.id}`
                                                    : undefined
                                            }
                                            params={params}
                                        />
                                    </Grid>
                                </DisplayIfUserHasPerm>
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
