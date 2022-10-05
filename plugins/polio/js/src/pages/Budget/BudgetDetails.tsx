import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import {
    Box,
    Grid,
    makeStyles,
    Typography,
    useMediaQuery,
    useTheme,
} from '@material-ui/core';

import { useDispatch, useSelector } from 'react-redux';
import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import MESSAGES from '../../constants/messages';
import { useStyles } from '../../styles/theme';
import { BUDGET, BUDGET_DETAILS } from '../../constants/routes';
import { useTableState } from './hooks/config';
import { BudgetStatus } from './BudgetStatus';
import { redirectToReplace } from '../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useBoundState } from '../../../../../../hat/assets/js/apps/Iaso/hooks/useBoundState';
import { Optional } from '../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { handleTableDeepLink } from '../../../../../../hat/assets/js/apps/Iaso/utils/table';
import { BudgetDetailsFilters } from './BudgetDetailsFilters';
import { useGetBudgetForCampaign } from './mockAPI/useGetBudget';
import { useGetBudgetDetails } from './mockAPI/useGetBudgetDetails';
import { CreateBudgetStep } from './CreateBudgetStep/CreateBudgetStep';
import { CreateOverrideStep } from './CreateBudgetStep/CreateOverrideStep';
import { BudgetDetailsCardsLayout } from './BudgetDetailsCardsLayout';
import { BudgetDetailsTableLayout } from './BudgetDetailsTableLayout';
import { BudgetDetailsFiltersMobile } from './BudgetDetailsFiltersMobile';

type Props = {
    router: any;
};

const useBudgetDetailsStyles = makeStyles(theme => ({
    pagination: {
        '&.MuiPagination-root > .MuiPagination-ul': {
            justifyContent: 'center',
        },
    },
    title: {
        fontWeight: 'bold',
        [theme.breakpoints.down('md')]: {
            fontSize: 22,
        },
    },
}));

export const BudgetDetails: FunctionComponent<Props> = ({ router }) => {
    const { params } = router;
    const classes = useStyles();
    const budgetDetailsClasses = useBudgetDetailsStyles();
    const {
        campaignName,
        campaignId,
        quickTransition,
        previousStep,
        ...apiParams
    } = router.params;
    const { formatMessage } = useSafeIntl();
    const [showDeleted, setShowDeleted] = useState(
        apiParams.show_deleted ?? false,
    );

    const checkBoxLabel = formatMessage(MESSAGES.showDeleted);
    // @ts-ignore
    const prevPathname = useSelector(state => state.routerCustom.prevPathname);
    const dispatch = useDispatch();

    const theme = useTheme();
    const isMobileLayout = useMediaQuery(theme.breakpoints.down('md'));

    const { data: budgetDetails, isFetching } = useGetBudgetDetails(apiParams);

    const previousBudgetStep = useMemo(() => {
        if (!quickTransition) return null;
        return (budgetDetails?.results ?? []).find(
            step => step.id === parseInt(previousStep, 10),
        );
    }, [budgetDetails?.results, previousStep, quickTransition]);

    const { data: budgetInfos } = useGetBudgetForCampaign(params?.campaignName);

    const budgetStatus = budgetInfos?.current_state.label ?? '--';

    const nextSteps = useMemo(() => {
        const regular = budgetInfos?.next_transitions?.filter(
            transition => transition.key !== 'override',
        );
        const override = budgetInfos?.next_transitions?.find(
            transition => transition.key === 'override',
        );
        return { regular, override };
    }, [budgetInfos?.next_transitions]);

    const { resetPageToOne, columns } = useTableState({
        events: budgetDetails?.results,
        params,
    });
    const [page, setPage] = useBoundState<Optional<number | string>>(
        1,
        apiParams?.page,
    );
    const onCardPaginationChange = useCallback(
        (_value, newPage) => {
            setPage(newPage);
            handleTableDeepLink(BUDGET_DETAILS)({ ...params, page: newPage });
        },
        [params, setPage],
    );

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.budgetDetails)}
                displayBackButton
                goBack={() => {
                    if (prevPathname) {
                        router.goBack();
                    } else {
                        dispatch(redirectToReplace(BUDGET, {}));
                    }
                }}
            />
            {/* @ts-ignore */}
            <Box
                // @ts-ignore
                className={`${classes.containerFullHeightNoTabPadded}`}
            >
                <Box mb={5}>
                    <Grid container>
                        <Grid item xs={isMobileLayout ? 12 : 6}>
                            <Box mb={4}>
                                <Typography
                                    className={budgetDetailsClasses.title}
                                    variant="h4"
                                >
                                    {`${formatMessage(
                                        MESSAGES.campaign,
                                    )}: ${campaignName}`}
                                </Typography>
                            </Box>
                        </Grid>
                        {!isMobileLayout && (
                            <Grid item xs={6}>
                                <BudgetDetailsFilters params={params} />
                            </Grid>
                        )}
                    </Grid>

                    <Grid container justifyContent="space-between" spacing={1}>
                        <Grid container item xs={12} lg={6} spacing={1}>
                            <BudgetStatus
                                budgetStatus={
                                    budgetInfos?.current_state?.label ?? '--'
                                }
                            />
                        </Grid>
                        {budgetStatus !== 'validated' && (
                            <Grid
                                container
                                item
                                direction="row"
                                xs={12}
                                lg={6}
                                justifyContent="flex-end"
                            >
                                {nextSteps && (
                                    <Grid
                                        container
                                        item
                                        xs={12}
                                        spacing={2}
                                        justifyContent="flex-end"
                                    >
                                        {nextSteps.regular &&
                                            nextSteps.regular.map(
                                                (step, index) => {
                                                    const isQuickTransition =
                                                        step.key ===
                                                        quickTransition;

                                                    return (
                                                        <Grid
                                                            item
                                                            key={`${step.key}-${index}`}
                                                        >
                                                            <CreateBudgetStep
                                                                isMobileLayout={
                                                                    isMobileLayout
                                                                }
                                                                // displayedFields={step.displayed_fields}
                                                                // requiredFields={step.required_fields}
                                                                campaignId={
                                                                    campaignId
                                                                }
                                                                iconProps={{
                                                                    label: step.label,
                                                                    color: 'primary',
                                                                    disabled:
                                                                        !step.allowed,
                                                                    // tooltipText={step.reason_not_allowed}
                                                                    // disabled={step.allowed}
                                                                }}
                                                                transitionKey={
                                                                    step.key
                                                                }
                                                                transitionLabel={
                                                                    step.label
                                                                }
                                                                defaultOpen={
                                                                    isQuickTransition
                                                                }
                                                                previousStep={
                                                                    isQuickTransition
                                                                        ? previousBudgetStep
                                                                        : undefined
                                                                }
                                                            />
                                                        </Grid>
                                                    );
                                                },
                                            )}
                                        {nextSteps.override?.allowed && (
                                            <Grid item>
                                                <CreateOverrideStep
                                                    isMobileLayout={
                                                        isMobileLayout
                                                    }
                                                    // displayedFields={step.displayed_fields}
                                                    // requiredFields={step.required_fields}
                                                    campaignId={campaignId}
                                                    iconProps={{
                                                        label: nextSteps
                                                            .override.label,
                                                        color: 'red',

                                                        // tooltipText={step.reason_not_allowed}
                                                        // disabled={step.allowed}
                                                    }}
                                                    transitionKey={
                                                        nextSteps.override
                                                            .transition_key
                                                    }
                                                    transitionLabel={
                                                        nextSteps.override.label
                                                    }
                                                />
                                            </Grid>
                                        )}
                                    </Grid>
                                )}
                            </Grid>
                        )}
                    </Grid>
                    <InputComponent
                        type="checkbox"
                        keyValue="showDeleted"
                        labelString={checkBoxLabel}
                        onChange={(_keyValue, newValue) => {
                            setShowDeleted(newValue);
                        }}
                        value={showDeleted}
                    />
                    {isMobileLayout && (
                        <BudgetDetailsFiltersMobile params={params} />
                    )}
                </Box>
                <Grid container spacing={2}>
                    {isMobileLayout && budgetDetails && (
                        <Grid item xs={12}>
                            <BudgetDetailsCardsLayout
                                onCardPaginationChange={onCardPaginationChange}
                                page={page}
                                budgetDetails={budgetDetails}
                            />
                        </Grid>
                    )}
                    {!isMobileLayout && (
                        <Grid item xs={12}>
                            <BudgetDetailsTableLayout
                                budgetDetails={budgetDetails}
                                params={params}
                                columns={columns}
                                isFetching={isFetching}
                                resetPageToOne={resetPageToOne}
                            />
                        </Grid>
                    )}
                </Grid>
            </Box>
        </>
    );
};
