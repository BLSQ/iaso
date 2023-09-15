import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
// @ts-ignore
import { Select, useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import { withRouter } from 'react-router';
import { useDispatch } from 'react-redux';
import { replace } from 'react-router-redux';
import RefreshIcon from '@material-ui/icons/Refresh';

import { Box, Button, Grid, IconButton } from '@material-ui/core';

import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import {
    useCreateTask,
    useTaskMonitor,
} from '../../../../../../hat/assets/js/apps/Iaso/hooks/taskMonitor';
import MESSAGES from '../../constants/messages';
import { makeCampaignsDropDown } from '../../utils/index';
import { genUrl } from '../../../../../../hat/assets/js/apps/Iaso/routing/routing';
import { useGetLqasImCountriesOptions } from '../../hooks/useGetLqasImCountriesOptions';
import { TaskApiResponse } from '../../../../../../hat/assets/js/apps/Iaso/domains/tasks/types';

const LQAS_TASK_ENDPOINT = '/api/polio/tasks/refreshlqas/';

type Params = {
    campaign: string | undefined;
    country: string | undefined;
    rounds: string | undefined;
};
type FiltersState = {
    campaign: string | undefined;
    country: number | undefined;
};
type Router = {
    params: Params;
};
type Props = {
    isFetching: boolean;
    router: Router;
    campaigns: any[];
    campaignsFetching: boolean;
    category: 'lqas' | 'im';
};

const Filters: FunctionComponent<Props> = ({
    isFetching,
    router,
    campaigns,
    campaignsFetching,
    category,
}) => {
    const taskUrl = category === 'lqas' ? LQAS_TASK_ENDPOINT : undefined;
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const { params } = router;

    const [taskId, setTaskId] = useState<number>();
    const { data: isDataUpdating, isFetching: isFetchingTaskStatus } =
        useTaskMonitor(taskId, taskUrl);

    console.log('TaskId', taskId);
    console.log('isDataUpdating', isDataUpdating);
    const { mutateAsync: createRefreshTask } = useCreateTask({
        endpoint: taskUrl,
    });

    const [filters, setFilters] = useState<FiltersState>({
        campaign: params.campaign,
        country: params.country ? parseInt(params.country, 10) : undefined,
    });
    const { campaign, country } = filters;

    const launchRefresh = useCallback(() => {
        if (country) {
            createRefreshTask({ country_id: country }).then(
                (task: TaskApiResponse<any>) => {
                    setTaskId(task.task.id);
                },
            );
        }
    }, [country, createRefreshTask]);

    // TODO invalidate lqas data queryKey when OH task SUCCESS

    const { data: countriesOptions, isFetching: countriesLoading } =
        useGetLqasImCountriesOptions(category);
    const dropDownOptions = useMemo(() => {
        const displayedCampaigns = country
            ? campaigns.filter(c => c.top_level_org_unit_id === country)
            : campaigns;
        return makeCampaignsDropDown(displayedCampaigns);
    }, [country, campaigns]);

    const onChange = (key, value) => {
        const newFilters = {
            ...filters,
            rounds: '1,2',
            [key]: value,
        };
        if (key === 'country') {
            newFilters.campaign = undefined;
        }

        setFilters(newFilters);
        const url = genUrl(router, newFilters);
        dispatch(replace(url));
    };
    const campaignObj = campaigns.find(c => c.obr_name === campaign);
    const campaignLink = campaignObj
        ? `/dashboard/polio/list/campaignId/${campaignObj.id}/search/${campaignObj.obr_name}`
        : null;
    const disableButton =
        isDataUpdating || isFetchingTaskStatus || isFetchingTaskStatus;
    return (
        <Box mt={2} width="100%">
            <Grid container item spacing={2}>
                <Grid item xs={4}>
                    <Select
                        keyValue="countries"
                        label={formatMessage(MESSAGES.country)}
                        loading={countriesLoading}
                        clearable
                        multi={false}
                        value={country?.toString()}
                        options={countriesOptions}
                        onChange={value => onChange('country', value)}
                    />
                </Grid>
                <Grid item xs={4}>
                    <Select
                        keyValue="campaigns"
                        label={formatMessage(MESSAGES.campaign)}
                        loading={campaignsFetching || isFetching}
                        clearable
                        multi={false}
                        value={campaign}
                        // Not showing campaigns before Im data has been fetched because selecting a campaign before the end of data fetching will cause bugs in the map
                        options={isFetching ? [] : dropDownOptions}
                        onChange={value => onChange('campaign', value)}
                        disabled={Boolean(!country) && isFetching}
                    />
                </Grid>
                {campaignLink && (
                    <Grid item md={1}>
                        <IconButton
                            target="_blank"
                            href={campaignLink}
                            color="primary"
                        >
                            <OpenInNewIcon />
                        </IconButton>
                    </Grid>
                )}
                {/* remove condition when IM pipeline is ready */}
                {category === 'lqas' && (
                    <Grid item md={campaignLink ? 3 : 4}>
                        <Box
                            display="flex"
                            justifyContent="flex-end"
                            width="100%"
                        >
                            <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={launchRefresh}
                                disabled={disableButton}
                            >
                                <Box mr={1} pt={1}>
                                    <RefreshIcon fontSize="small" />
                                </Box>
                                {formatMessage(MESSAGES.refreshLqasData)}
                                {disableButton && (
                                    <LoadingSpinner
                                        size={16}
                                        absolute
                                        fixed={false}
                                        transparent
                                    />
                                )}
                            </Button>
                        </Box>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

const wrappedFilters = withRouter(Filters);
export { wrappedFilters as Filters };
