import React from 'react';
import PropTypes from 'prop-types';
import { Box, makeStyles } from '@material-ui/core';
import { commonStyles, LoadingSpinner } from 'bluesquare-components';
import TopBar from '../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';

import { CampaignsCalendar } from '../components/campaignCalendar';
import { useGetCampaigns } from '../hooks/useGetCampaigns';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Calendar = ({ params }) => {
    const classes = useStyles();
    const { query } = useGetCampaigns({
        // searchQuery: 'SLE-16DS-01-2021',
        order: 'top_level_org_unit_name',
    });

    const { data: campaigns = [], status } = query;
    return (
        <div>
            <TopBar title="Calendar" displayBackButton={false} />
            {status === 'loading' && <LoadingSpinner />}
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Box width={1}>
                    <CampaignsCalendar params={params} campaigns={campaigns} />
                </Box>
            </Box>
        </div>
    );
};

Calendar.propTypes = {
    params: PropTypes.object.isRequired,
};

export { Calendar };
