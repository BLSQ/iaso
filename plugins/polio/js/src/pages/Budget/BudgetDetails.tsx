import React, { FunctionComponent, useCallback, useState } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    useSkipEffectOnMount,
    // @ts-ignore
    LoadingSpinner,
} from 'bluesquare-components';
import { Box, Divider, Grid, Paper, Typography } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
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
import { BudgetValidationPopUp } from './BudgetValidationPopUp';
import { BudgetRejectionPopUp } from './BudgetRejectionPopUp';

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

export const BudgetDetails: FunctionComponent<Props> = ({ router }) => {
    const { params } = router;
    const classes = useStyles();
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

    const { data: budgetDetails, isFetching } = useGetBudgetDetails(userId, {
        ...apiParams,
        campaign_id: campaignId,
        order: apiParams.order ?? '-created_at',
        show_deleted: showDeleted,
    });

    const { data: allBudgetDetails, isFetching: isFetchingAll } =
        useGetAllBudgetDetails(campaignId, showDeleted);

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
    const columns = useBudgetDetailsColumns({ profiles });

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
            {params.action === 'confirmApproval' && (
                <BudgetValidationPopUp
                    campaignName={campaignName}
                    campaignId={campaignId}
                    params={params}
                />
            )}
            {params.action === 'rejectApproval' && (
                <BudgetRejectionPopUp
                    campaignName={campaignName}
                    campaignId={campaignId}
                    params={params}
                />
            )}
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

                    <Grid container justifyContent="space-between">
                        <Grid container item xs={6}>
                            {!isFetchingAll && (
                                <BudgetStatus budgetStatus={budgetStatus} />
                            )}
                        </Grid>
                        {budgetStatus !== 'validated' && (
                            <Grid>
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
                    <Grid item xs={8}>
                        <Paper elevation={2}>
                            <Box
                                ml={2}
                                pt={2}
                                mr={2}
                                pb={budgetDetails?.results.length === 0 ? 1 : 0}
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
                                            isFetching || isFetchingProfiles,
                                        columns,
                                    }}
                                    resetPageToOne={resetPageToOne}
                                    elevation={0}
                                />
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={4}>
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
                                            getMainLayerStyle={getShapeStyle}
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
                </Grid>
            </Box>
        </>
    );
};
