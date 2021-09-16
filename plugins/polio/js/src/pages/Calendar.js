import React from 'react';
import PropTypes from 'prop-types';
import { Box, makeStyles } from '@material-ui/core';
import { commonStyles } from 'bluesquare-components';
import TopBar from '../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';

import { CampaignsCalendar } from '../components/campaignCalendar';
import { useGetCampaigns } from '../hooks/useGetCampaigns';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Calendar = ({ params }) => {
    const classes = useStyles();
    const { query } = useGetCampaigns({
        // searchQuery: 'MLI-8DS-09-2020',
        order: '-obr_name',
    });

    const { data: campaigns = [] } = query;
    return (
        <div>
            <TopBar title="Calendar" displayBackButton={false} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <CampaignsCalendar params={params} campaigns={campaigns} />
            </Box>
        </div>
    );
};

Calendar.propTypes = {
    params: PropTypes.object.isRequired,
};

export { Calendar };
