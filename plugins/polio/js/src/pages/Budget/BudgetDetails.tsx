import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    useSkipEffectOnMount,
    // @ts-ignore
    LoadingSpinner,
} from 'bluesquare-components';
import {
    Box,
    Divider,
    Grid,
    makeStyles,
    Paper,
    Typography,
    useMediaQuery,
    useTheme,
} from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { Pagination } from '@material-ui/lab';
import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import MESSAGES from '../../constants/messages';
import { convertObjectToString } from '../../utils';
import { useStyles } from '../../styles/theme';
import { TableWithDeepLink } from '../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import {
    useGetAllBudgetDetails,
    useGetBudgetDetails,
} from '../../hooks/useGetBudgetDetails';
import { BUDGET, BUDGET_DETAILS } from '../../constants/routes';
import { useBudgetDetailsColumns } from './hooks/config';
import { useGetProfiles } from '../../components/CountryNotificationsConfig/requests';
import { GraphTitle } from '../../components/LQAS-IM/GraphTitle';
import { BudgetStatus, findBudgetStatus } from './BudgetStatus';
import { CreateEditBudgetEvent } from './CreateEditBudgetEvent';
import { redirectToReplace } from '../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import { MapComponent } from '../../components/MapComponent/MapComponent';
import { useGetGeoJson } from '../../hooks/useGetGeoJson';
import { useGetCampaignScope } from '../../hooks/useGetCampaignScope';
import { useCurrentUser } from '../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { BudgetValidationPopUp } from './pop-ups/BudgetValidationPopUp';
import { BudgetRejectionPopUp } from './pop-ups/BudgetRejectionPopUp';
import { useGetApprovalTeams } from '../../hooks/useGetTeams';
import { BudgetEventCard } from './cards/BudgetEventCard';
import { useBoundState } from '../../../../../../hat/assets/js/apps/Iaso/domains/assignments/hooks/useBoundState';
import { Optional } from '../../../../../../hat/assets/js/apps/Iaso/types/utils';

type Props = {
    router: any;
};

const selectedPathOptions = {
    color: 'lime',
    weight: '1',
    opacity: '1',
    zIndex: '1',
};
const unselectedPathOptions = {
    color: 'gray',
    weight: '1',
    opacity: '1',
    zIndex: '1',
};
const getBackgroundLayerStyle = () => {
    return {
        color: 'grey',
        opacity: '1',
        fillColor: 'transparent',
    };
};

const useIsUserInApprovalTeam = (userId?: number): boolean => {
    const { data: approvalTeams, isFetching } = useGetApprovalTeams();
    const [isUserInApprovalTeam, setIsUserInApprovalTeam] =
        useState<boolean>(false);

    useEffect(() => {
        if (userId && !isFetching)
            setIsUserInApprovalTeam(
                Boolean(
                    approvalTeams.find(team => team.users.includes(userId)),
                ),
            );
    }, [approvalTeams, isFetching, userId]);

    return isUserInApprovalTeam;
};

const style = () => {
    return {
        pagination: {
            '&.MuiPagination-root > .MuiPagination-ul': {
                justifyContent: 'center',
            },
        },
    };
};

const usePaginationStyles = makeStyles(style);

export const BudgetDetails: FunctionComponent<Props> = ({ router }) => {
    const { params } = router;
    const classes = useStyles();
    const paginationStyle = usePaginationStyles();
    const { campaignName, campaignId, country, ...apiParams } = router.params;
    const { formatMessage } = useSafeIntl();
    const [showDeleted, setShowDeleted] = useState(
        apiParams.show_deleted ?? false,
    );

    const checkBoxLabel = formatMessage(MESSAGES.showDeleted);
    // @ts-ignore
    const prevPathname = useSelector(state => state.routerCustom.prevPathname);
    const dispatch = useDispatch();
    const { user_id: userId } = useCurrentUser();
    const isUserInApprovalTeam = useIsUserInApprovalTeam(userId);
    const [page, setPage] = useBoundState<Optional<number>>(1, apiParams?.page);
    const theme = useTheme();
    const isMobileLayout = useMediaQuery(theme.breakpoints.down('md'));
    const { data: budgetDetails, isFetching } = useGetBudgetDetails(userId, {
        ...apiParams,
        campaign_id: campaignId,
        order: apiParams.order ?? '-created_at',
        show_deleted: showDeleted,
        page,
    });

    const { data: allBudgetDetails, isFetching: isFetchingAll } =
        useGetAllBudgetDetails(campaignId, showDeleted);

    const budgetHasSubmission = Boolean(
        allBudgetDetails?.find(
            budgetEvent =>
                budgetEvent.type === 'submission' && !budgetEvent.deleted_at,
        ),
    );
    // TODO make hook for table specific state and effects
    const [resetPageToOne, setResetPageToOne] = useState('');

    useSkipEffectOnMount(() => {
        const newParams = {
            ...params,
        };
        delete newParams.page;
        delete newParams.order;
        setResetPageToOne(convertObjectToString(newParams));
    }, [params.pageSize, campaignId, campaignName]);

    const { data: profiles, isFetching: isFetchingProfiles } = useGetProfiles();
    const columns = useBudgetDetailsColumns({
        profiles,
        data: budgetDetails?.results,
    });

    const { data: districtShapes, isFetching: isFetchingDistricts } =
        useGetGeoJson(country, 'DISTRICT');

    const { data: regionShapes, isFetching: isFetchingRegions } = useGetGeoJson(
        country,
        'REGION',
    );

    const { data: scope, isFetching: isFetchingScope } = useGetCampaignScope({
        country: parseInt(country, 10),
        campaignId,
    });

    const budgetStatus = findBudgetStatus(allBudgetDetails);

    const getShapeStyle = useCallback(
        shape => {
            if (scope.includes(shape.id)) return selectedPathOptions;
            return unselectedPathOptions;
        },
        [scope],
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
                <Box mb={5} ml={2} mr={2}>
                    <Box mb={4}>
                        <Typography variant="h4" style={{ fontWeight: 'bold' }}>
                            {`${formatMessage(
                                MESSAGES.campaign,
                            )}: ${campaignName}`}
                        </Typography>
                    </Box>

                    <Grid container justifyContent="space-between" spacing={1}>
                        <Grid container item xs={6} spacing={1}>
                            {!isFetchingAll && (
                                <BudgetStatus budgetStatus={budgetStatus} />
                            )}
                        </Grid>
                        {budgetStatus !== 'validated' && (
                            <Grid
                                container
                                item
                                direction="row"
                                xs={6}
                                justifyContent="flex-end"
                            >
                                {budgetStatus !== 'approved' &&
                                    isUserInApprovalTeam &&
                                    budgetHasSubmission && (
                                        <Box
                                            mr={isMobileLayout ? 0 : 4}
                                            mb={isMobileLayout ? 1 : 0}
                                        >
                                            <BudgetValidationPopUp
                                                campaignName={campaignName}
                                                campaignId={campaignId}
                                                params={params}
                                            />
                                        </Box>
                                    )}
                                {params.action === 'addComment' &&
                                    budgetStatus !== 'approved' &&
                                    isUserInApprovalTeam && (
                                        <Box mr={isMobileLayout ? 0 : 4}>
                                            <BudgetRejectionPopUp
                                                campaignName={campaignName}
                                                campaignId={campaignId}
                                                params={params}
                                            />
                                        </Box>
                                    )}
                                <CreateEditBudgetEvent
                                    campaignId={campaignId}
                                />
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
                </Box>
                <Grid container spacing={2}>
                    {/* TODO add loading state */}
                    {isMobileLayout && budgetDetails && profiles && (
                        <Grid item xs={12}>
                            {budgetDetails?.results.map(budgetEvent => {
                                return (
                                    <BudgetEventCard
                                        key={`event-${budgetEvent.id}`}
                                        event={budgetEvent}
                                        profiles={profiles?.profiles}
                                    />
                                );
                            })}
                            {budgetDetails && (
                                <Pagination
                                    className={paginationStyle.pagination}
                                    page={page}
                                    count={budgetDetails?.pages}
                                    showLastButton
                                    showFirstButton
                                    onChange={(value, newPage) => {
                                        setPage(newPage);
                                    }}
                                    hidePrevButton={false}
                                    hideNextButton={false}
                                />
                            )}
                        </Grid>
                    )}
                    {!isMobileLayout && (
                        <Grid item xs={8}>
                            <Paper elevation={2}>
                                <Box
                                    ml={2}
                                    pt={2}
                                    mr={2}
                                    pb={
                                        budgetDetails?.results.length === 0
                                            ? 1
                                            : 0
                                    }
                                >
                                    <GraphTitle
                                        text={formatMessage(MESSAGES.steps)}
                                        displayTrigger
                                    />
                                    <Box mt={2} mb={1}>
                                        <Divider />
                                    </Box>
                                    <TableWithDeepLink
                                        data={budgetDetails?.results ?? []}
                                        count={budgetDetails?.count}
                                        pages={budgetDetails?.pages}
                                        params={params}
                                        columns={columns}
                                        baseUrl={BUDGET_DETAILS}
                                        marginTop={false}
                                        extraProps={{
                                            loading:
                                                isFetching ||
                                                isFetchingProfiles,
                                            columns,
                                        }}
                                        resetPageToOne={resetPageToOne}
                                        elevation={0}
                                    />
                                </Box>
                            </Paper>
                        </Grid>
                    )}
                    {!isMobileLayout && (
                        <Grid item xs={12} md={4}>
                            <Paper>
                                <Box ml={2} pt={2} mr={2} pb={2}>
                                    <GraphTitle
                                        text={formatMessage(MESSAGES.scope)}
                                        displayTrigger
                                    />
                                    <Box mt={2} mb={1}>
                                        <Divider />
                                    </Box>
                                    {(isFetchingRegions ||
                                        isFetchingDistricts ||
                                        isFetchingScope) && (
                                        <LoadingSpinner fixed={false} />
                                    )}
                                    {!isFetchingRegions &&
                                        !isFetchingDistricts &&
                                        !isFetchingScope && (
                                            <MapComponent
                                                name="BudgetScopeMap"
                                                mainLayer={districtShapes}
                                                backgroundLayer={regionShapes}
                                                onSelectShape={() => null}
                                                getMainLayerStyle={
                                                    getShapeStyle
                                                }
                                                getBackgroundLayerStyle={
                                                    getBackgroundLayerStyle
                                                }
                                                tooltipLabels={{
                                                    main: 'District',
                                                    background: 'Region',
                                                }}
                                            />
                                        )}
                                </Box>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </>
    );
};
