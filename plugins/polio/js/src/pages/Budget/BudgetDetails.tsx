import React, { FunctionComponent, useState } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    useSkipEffectOnMount,
    // @ts-ignore
    AddButton,
} from 'bluesquare-components';
import { Box } from '@material-ui/core';
import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import MESSAGES from '../../constants/messages';
import { convertObjectToString } from '../../utils';
import { useStyles } from '../../styles/theme';
import { TableWithDeepLink } from '../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { useGetBudgetDetails } from '../../hooks/useGetBudgetDetails';
import { BUDGET_DETAILS } from '../../constants/routes';
import { useBudgetDetailsColumns } from './config';
import { useGetTeams } from '../../hooks/useGetTeams';
import { useGetProfiles } from '../../components/CountryNotificationsConfig/requests';
import { GraphTitle } from '../../components/LQAS-IM/GraphTitle';
import { BudgetStatus } from './BudgetStatus';

type Props = {
    router: any;
};

export const BudgetDetails: FunctionComponent<Props> = ({ router }) => {
    const { params } = router;
    const classes = useStyles();
    const { campaignName, campaignId, ...paginationParams } = router.params;
    const { formatMessage } = useSafeIntl();

    const { data: budgetDetails, isFetching } =
        useGetBudgetDetails(paginationParams);
    // TODO make hook for table specific state and effects
    const [resetPageToOne, setResetPageToOne] = useState('');
    // const [campaignDialogOpen, setCampaignDialogOpen] =
    //     useState<boolean>(false);

    // const apiParams = useCampaignParams({
    //     ...params,
    //     show_test: params.show_test ?? false,
    //     pageSize: params.pageSize ?? 20,
    // });

    // const { data: campaigns, isFetching } = useGetCampaigns(apiParams).query;
    // const columns = useBudgetColumns();
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

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.budgetDetails, { campaignName })}
                displayBackButton
                goBack={() => router.goBack()}
            />
            {/* @ts-ignore */}
            <Box className={classes.containerFullHeightNoTabPadded}>
                <BudgetStatus budgetDetails={budgetDetails} />
                <AddButton
                    onClick={() => {
                        console.log('Add step');
                    }}
                    dataTestId="create-campaign-button"
                    message={MESSAGES.addCampaign}
                />
                <GraphTitle text="Steps" displayTrigger />
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
                            isFetching || isFetchingProfiles || isFetchingTeams,
                    }}
                    resetPageToOne={resetPageToOne}
                />
            </Box>
        </>
    );
};
