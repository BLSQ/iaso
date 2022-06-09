import React, { FunctionComponent, useCallback, useState } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    useSkipEffectOnMount,
    // @ts-ignore
    LoadingSpinner,
} from 'bluesquare-components';
import { Box, Divider, Grid, Paper } from '@material-ui/core';
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
import { useGetTeams } from '../../hooks/useGetTeams';
import { useGetProfiles } from '../../components/CountryNotificationsConfig/requests';
import { GraphTitle } from '../../components/LQAS-IM/GraphTitle';
import { BudgetStatus } from './BudgetStatus';
import { CreateBudgetEvent } from './CreateBudgetEvent';
import { redirectToReplace } from '../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import { MapComponent } from '../../components/MapComponent/MapComponent';
import { useGetGeoJson } from '../../hooks/useGetGeoJson';
import { useGetCampaignScope } from '../../hooks/useGetCampaignScope';

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
// const initialDistrict = {
//     color: '#FF695C',
//     weight: '1',
//     opacity: '1',
//     zIndex: '1',
// };

export const BudgetDetails: FunctionComponent<Props> = ({ router }) => {
    const { params } = router;
    const classes = useStyles();
    const { campaignName, campaignId, country, ...apiParams } = router.params;
    const { formatMessage } = useSafeIntl();
    // @ts-ignore
    const prevPathname = useSelector(state => state.routerCustom.prevPathname);
    const dispatch = useDispatch();

    const { data: budgetDetails, isFetching } = useGetBudgetDetails({
        ...apiParams,
        campaign_id: campaignId,
        order: apiParams.order ?? '-created_at',
    });
    const { data: allBudgetDetails, isFetching: isFetchingAll } =
        useGetAllBudgetDetails(campaignId);

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

    const { data: teams, isFetching: isFetchingTeams } = useGetTeams();
    const { data: profiles, isFetching: isFetchingProfiles } = useGetProfiles();
    const columns = useBudgetDetailsColumns({ teams, profiles });

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

    const getShapeStyle = useCallback(
        shape => {
            if (scope.includes(shape.id)) return selectedPathOptions;
            return unselectedPathOptions;
        },
        [scope],
    );

    const getBackgroundLayerStyle = () => {
        return {
            color: 'grey',
            opacity: '1',
            fillColor: 'transparent',
        };
    };
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.budgetDetails, { campaignName })}
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
                className={`${classes.containerFullHeightNoTabPadded} ${classes.fullHeight}`}
            >
                <Box mb={4} ml={2} mr={2}>
                    <Grid container justifyContent="space-between">
                        <Grid container item xs={6}>
                            {!isFetchingAll && (
                                <BudgetStatus
                                    budgetDetails={allBudgetDetails}
                                />
                            )}
                        </Grid>
                        <Grid>
                            <CreateBudgetEvent campaignId={campaignId} />
                        </Grid>
                    </Grid>
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
                                            isFetching ||
                                            isFetchingProfiles ||
                                            isFetchingTeams,
                                    }}
                                    resetPageToOne={resetPageToOne}
                                    elevation={0}
                                />
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={4}>
                        {(isFetchingRegions ||
                            isFetchingDistricts ||
                            isFetchingScope) && (
                            <LoadingSpinner fixed={false} />
                        )}
                        <Paper>
                            <Box ml={2} pt={2} mr={2} pb={2}>
                                <GraphTitle
                                    text={formatMessage(MESSAGES.scope)}
                                    displayTrigger
                                />
                                <Box mt={2} mb={1}>
                                    <Divider />
                                </Box>
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
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};
