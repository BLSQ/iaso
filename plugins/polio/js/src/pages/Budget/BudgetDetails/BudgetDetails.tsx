/* eslint-disable react/no-array-index-key */
/* eslint-disable camelcase */
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
import { groupBy } from 'lodash';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import MESSAGES from '../../../constants/messages';
import { useStyles } from '../../../styles/theme';
import { BUDGET, BUDGET_DETAILS } from '../../../constants/routes';
import { useTableState } from '../hooks/config';
import { BudgetStatus } from '../BudgetStatus';
import { redirectToReplace } from '../../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useBoundState } from '../../../../../../../hat/assets/js/apps/Iaso/hooks/useBoundState';
import { Optional } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { handleTableDeepLink } from '../../../../../../../hat/assets/js/apps/Iaso/utils/table';
import { BudgetDetailsFilters } from './BudgetDetailsFilters';
import { useGetBudgetForCampaign } from '../hooks/api/useGetBudget';
import { useGetBudgetDetails } from '../hooks/api/useGetBudgetDetails';
import { CreateBudgetStep } from '../CreateBudgetStep/CreateBudgetStep';
import { CreateOverrideStep } from '../CreateBudgetStep/CreateOverrideStep';
import { BudgetDetailsCardsLayout } from './mobile/BudgetDetailsCardsLayout';
import { BudgetDetailsTableLayout } from './BudgetDetailsTableLayout';
import { BudgetDetailsFiltersMobile } from './mobile/BudgetDetailsFiltersMobile';
import { NextBudgetStep } from '../NextBudgetStep';

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
        transition_key,
        ...rest
    } = router.params;
    const { formatMessage } = useSafeIntl();
    const [showHidden, setShowHidden] = useState<boolean>(
        rest.show_hidden ?? false,
    );

    const apiParams = useMemo(() => {
        return {
            ...rest,
            deletion_status: showHidden ? 'all' : undefined,
            campaign_id: campaignId,
            transition_key__in: transition_key,
        };
    }, [campaignId, rest, showHidden, transition_key]);

    const checkBoxLabel = formatMessage(MESSAGES.showHidden);
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

    const { data: budgetInfos } = useGetBudgetForCampaign(params?.campaignId);

    const budgetStatus = budgetInfos?.current_state?.label ?? '--';

    const nextSteps = useMemo(() => {
        const regular = budgetInfos?.next_transitions?.filter(
            transition => transition.key !== 'override',
        );
        const override = budgetInfos?.next_transitions?.find(
            transition => transition.key === 'override',
        );
        const toDisplay = new Set(
            regular
                ?.filter(
                    transition =>
                        transition.key !== budgetInfos?.current_state?.key,
                )
                .map(transition => transition.label),
        );
        return { regular, override, toDisplay };
    }, [budgetInfos?.current_state?.key, budgetInfos?.next_transitions]);

    const { resetPageToOne, columns } = useTableState({
        events: budgetDetails?.results,
        params,
    });
    const [page, setPage] = useBoundState<Optional<number | string>>(
        1,
        apiParams?.page ?? 1,
    );
    const onCardPaginationChange = useCallback(
        (_value, newPage) => {
            setPage(newPage);
            handleTableDeepLink(BUDGET_DETAILS)({ ...params, page: newPage });
        },
        [params, setPage],
    );
    const stepsList = Object.entries(
        groupBy(budgetInfos?.possible_transitions, 'label'),
    ).map(([label, items]) => {
        return { label, value: items.map(i => i.key).join(',') };
    });

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
            <Box className={classes.containerFullHeightNoTabPadded}>
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
                                <BudgetDetailsFilters
                                    params={params}
                                    stepsList={stepsList}
                                />
                            </Grid>
                        )}
                    </Grid>

                    <Grid container justifyContent="space-between" spacing={1}>
                        <Grid container item xs={12} lg={4} spacing={1}>
                            <BudgetStatus
                                budgetStatus={
                                    budgetInfos?.current_state?.label ?? '--'
                                }
                            />
                        </Grid>
                        <Grid
                            container
                            item
                            xs={12}
                            lg={4}
                            spacing={1}
                            justifyContent="center"
                        >
                            <NextBudgetStep
                                nextSteps={Array.from(
                                    nextSteps.toDisplay.values(),
                                )}
                            />
                        </Grid>
                        {budgetStatus !== 'validated' && (
                            <Grid
                                container
                                item
                                direction="row"
                                xs={12}
                                lg={4}
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
                                            nextSteps.regular
                                                .filter(step => step.allowed)
                                                .map((step, index) => {
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
                                                                campaignId={
                                                                    campaignId
                                                                }
                                                                iconProps={{
                                                                    label: step.label,
                                                                    color: step.color,
                                                                    disabled:
                                                                        !step.allowed,
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
                                                                requiredFields={
                                                                    step.required_fields
                                                                }
                                                                params={params}
                                                            />
                                                        </Grid>
                                                    );
                                                })}
                                        {nextSteps.override?.allowed && (
                                            <Grid item>
                                                <CreateOverrideStep
                                                    isMobileLayout={
                                                        isMobileLayout
                                                    }
                                                    campaignId={campaignId}
                                                    iconProps={{
                                                        label: nextSteps
                                                            .override.label,
                                                        color: nextSteps
                                                            .override.color,
                                                    }}
                                                    transitionKey={
                                                        nextSteps.override.key
                                                    }
                                                    transitionLabel={
                                                        nextSteps.override.label
                                                    }
                                                    requiredFields={
                                                        nextSteps.override
                                                            .required_fields
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
                        keyValue="showHidden"
                        labelString={checkBoxLabel}
                        onChange={(_keyValue, newValue) => {
                            setShowHidden(newValue);
                        }}
                        value={showHidden}
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
