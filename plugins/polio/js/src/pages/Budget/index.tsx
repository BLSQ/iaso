import React, { FunctionComponent, useState } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    useSkipEffectOnMount,
    // @ts-ignore
    AddButton,
} from 'bluesquare-components';
// @ts-ignore
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { Box, Grid } from '@material-ui/core';
import { TableWithDeepLink } from '../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import {
    useCampaignParams,
    useGetCampaigns,
} from '../../hooks/useGetCampaigns';
import { useStyles } from '../../styles/theme';
import { BUDGET } from '../../constants/routes';
import { useBudgetColumns } from './hooks/config';
import { convertObjectToString } from '../../utils';
import MESSAGES from '../../constants/messages';
import { BudgetFilters } from './BudgetFilters';
import { PolioCreateEditDialog } from '../../components/CreateEditDialog';

type Props = {
    router: any;
};

export const Budget: FunctionComponent<Props> = ({ router }) => {
    const { params } = router;
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const [resetPageToOne, setResetPageToOne] = useState('');
    const [campaignDialogOpen, setCampaignDialogOpen] =
        useState<boolean>(false);

    const apiParams = useCampaignParams({
        ...params,
        show_test: params.show_test ?? false,
        pageSize: params.pageSize ?? 20,
    });

    const { data: campaigns, isFetching } = useGetCampaigns(apiParams).query;
    const columns = useBudgetColumns();

    useSkipEffectOnMount(() => {
        const newParams = {
            ...apiParams,
        };
        delete newParams.page;
        delete newParams.order;
        setResetPageToOne(convertObjectToString(newParams));
    }, [apiParams.pageSize, apiParams.countries, apiParams.search]);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.budget)}
                displayBackButton={false}
            />
            {/* @ts-ignore */}
            <Box className={classes.containerFullHeightNoTabPadded}>
                <BudgetFilters params={params} />
                <Grid container item justifyContent="flex-end">
                    <AddButton
                        onClick={() => {
                            setCampaignDialogOpen(true);
                        }}
                        dataTestId="create-campaign-button"
                        message={MESSAGES.addCampaign}
                    />
                </Grid>
                <TableWithDeepLink
                    data={campaigns?.campaigns ?? []}
                    count={campaigns?.count}
                    pages={campaigns?.pages}
                    params={apiParams}
                    columns={columns}
                    baseUrl={BUDGET}
                    marginTop={false}
                    extraProps={{
                        loading: isFetching,
                    }}
                    resetPageToOne={resetPageToOne}
                />
            </Box>
            <PolioCreateEditDialog
                isOpen={campaignDialogOpen}
                onClose={() => setCampaignDialogOpen(false)}
            />
        </>
    );
};
