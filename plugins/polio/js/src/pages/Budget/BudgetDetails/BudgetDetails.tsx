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
import { Box, Grid, useMediaQuery, useTheme } from '@material-ui/core';

import { useDispatch, useSelector } from 'react-redux';
import { groupBy } from 'lodash';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import MESSAGES from '../../../constants/messages';
import { useStyles } from '../../../styles/theme';
import { BUDGET, BUDGET_DETAILS } from '../../../constants/routes';
import { useTableState } from '../hooks/config';
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
import { BudgetDetailsInfos } from './BudgetDetailsInfos';
import { BudgetTimeline } from './BudgetTimeline';

type Props = {
    router: any;
};

export const BudgetDetails: FunctionComponent<Props> = ({ router }) => {
    const { params } = router;
    const classes = useStyles();
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
                title={campaignName}
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
                <Box mb={4}>
                    <Grid container justifyContent="space-between" spacing={1}>
                        <Grid item xs={12} lg={6}>
                            <BudgetDetailsInfos
                                status={
                                    budgetInfos?.current_state?.label ?? '--'
                                }
                                nextSteps={Array.from(
                                    nextSteps.toDisplay.values(),
                                )}
                            />
                        </Grid>
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
                                        nextSteps.regular
                                            .filter(step => step.allowed)
                                            .map((step, index) => {
                                                const isQuickTransition =
                                                    step.key ===
                                                    quickTransition;

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
                                                isMobileLayout={isMobileLayout}
                                                campaignId={campaignId}
                                                iconProps={{
                                                    label: nextSteps.override
                                                        .label,
                                                    color: nextSteps.override
                                                        .color,
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
                    </Grid>

                    {!isMobileLayout && (
                        <Box pt={5} pb={5}>
                            <BudgetTimeline
                                categories={budgetInfos?.timeline?.categories}
                            />
                        </Box>
                    )}

                    {isMobileLayout && (
                        <Box pt={5} pb={5}>
                            <BudgetTimeline
                                categories={budgetInfos?.timeline?.categories}
                                orientation="vertical"
                            />
                        </Box>
                    )}

                    {!isMobileLayout && (
                        <Box pl={5}>
                            <BudgetDetailsFilters
                                params={params}
                                stepsList={stepsList}
                            />
                        </Box>
                    )}

                    <Box pl={5}>
                        <InputComponent
                            type="checkbox"
                            keyValue="showHidden"
                            labelString={checkBoxLabel}
                            onChange={(_keyValue, newValue) => {
                                setShowHidden(newValue);
                            }}
                            value={showHidden}
                            withMarginTop={false}
                        />
                    </Box>

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
                            <Box pl={5}>
                                <BudgetDetailsTableLayout
                                    budgetDetails={budgetDetails}
                                    params={params}
                                    columns={columns}
                                    isFetching={isFetching}
                                    resetPageToOne={resetPageToOne}
                                />
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </>
    );
};
