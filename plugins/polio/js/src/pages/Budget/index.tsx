import React, { FunctionComponent, useState, useCallback } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    useSkipEffectOnMount,
    // @ts-ignore
    AddButton,
    // @ts-ignore
    LoadingSpinner,
} from 'bluesquare-components';
import {
    Box,
    Grid,
    useMediaQuery,
    useTheme,
    Collapse,
    makeStyles,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import { Pagination } from '@material-ui/lab';

// @ts-ignore
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';

import {
    useCampaignParams,
    useGetCampaigns,
} from '../../hooks/useGetCampaigns';

import { useStyles } from '../../styles/theme';
import { BUDGET } from '../../constants/routes';
import MESSAGES from '../../constants/messages';
import { useBudgetColumns } from './hooks/config';

import { convertObjectToString } from '../../utils';

import { BudgetFilters } from './BudgetFilters';
import { PolioCreateEditDialog } from '../../components/CreateEditDialog';
import { BudgetCard, CardCampaign } from './cards/BudgetCard';

import { handleTableDeepLink } from '../../../../../../hat/assets/js/apps/Iaso/utils/table';

type Props = {
    router: any;
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

export const Budget: FunctionComponent<Props> = ({ router }) => {
    const { params } = router;
    const { formatMessage } = useSafeIntl();
    const paginationStyle = usePaginationStyles();
    const classes = useStyles();
    const [resetPageToOne, setResetPageToOne] = useState<string>('');
    const [expand, setExpand] = useState<boolean>(false);
    const [campaignDialogOpen, setCampaignDialogOpen] =
        useState<boolean>(false);

    const apiParams = useCampaignParams({
        ...params,
        show_test: params.show_test ?? false,
        pageSize: params.pageSize ?? 10,
    });

    const { data: campaigns, isFetching } = useGetCampaigns(apiParams).query;
    const columns = useBudgetColumns();
    const theme = useTheme();
    const isMobileLayout = useMediaQuery(theme.breakpoints.down('md'));

    useSkipEffectOnMount(() => {
        const newParams = {
            ...apiParams,
        };
        delete newParams.page;
        delete newParams.order;
        setResetPageToOne(convertObjectToString(newParams));
    }, [apiParams.pageSize, apiParams.countries, apiParams.search]);

    const onCardPaginationChange = useCallback(
        (_value, newPage) => {
            handleTableDeepLink(BUDGET)({ ...apiParams, page: newPage });
        },
        [apiParams],
    );

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.budget)}
                displayBackButton={false}
            >
                <Box
                    position="absolute"
                    top={theme.spacing(2)}
                    right={theme.spacing(2)}
                >
                    <SearchIcon
                        onClick={() => {
                            setExpand(value => !value);
                        }}
                    />
                </Box>
            </TopBar>
            {/* @ts-ignore */}
            <Box className={classes.containerFullHeightNoTabPadded}>
                {isMobileLayout && (
                    <Collapse in={expand}>
                        <BudgetFilters params={params} buttonSize="small" />
                    </Collapse>
                )}

                {!isMobileLayout && (
                    <>
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
                    </>
                )}
                {isMobileLayout && (
                    <>
                        {isFetching && <LoadingSpinner />}
                        {campaigns?.campaigns &&
                            campaigns.campaigns.map(
                                (campaign: CardCampaign) => (
                                    <Box key={campaign.id} mb={1}>
                                        <BudgetCard campaign={campaign} />
                                    </Box>
                                ),
                            )}

                        {campaigns && (
                            <Pagination
                                className={paginationStyle.pagination}
                                page={campaigns.page}
                                count={campaigns.pages}
                                showLastButton
                                showFirstButton
                                onChange={onCardPaginationChange}
                                hidePrevButton={false}
                                hideNextButton={false}
                                size="small"
                            />
                        )}
                    </>
                )}
            </Box>
            {!isMobileLayout && (
                <PolioCreateEditDialog
                    isOpen={campaignDialogOpen}
                    onClose={() => setCampaignDialogOpen(false)}
                />
            )}
        </>
    );
};
