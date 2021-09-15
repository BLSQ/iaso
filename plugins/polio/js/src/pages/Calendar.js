import React from 'react';
import PropTypes from 'prop-types';
import { Box, makeStyles } from '@material-ui/core';
import { commonStyles } from 'bluesquare-components';
import TopBar from '../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';

import { CampaignsCalendar } from '../components/campaignCalendar';

const campaigns = [
    {
        id: 1,
        r1WeekIndex: [1],
        campaignWeeks: 6,
        r2WeekIndex: [8],
    },
    {
        id: 2,
        r1WeekIndex: [5],
        campaignWeeks: 6,
        r2WeekIndex: [12],
    },
    {
        id: 3,
        r1WeekIndex: [11],
        campaignWeeks: 6,
    },
];

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Calendar = ({ params }) => {
    const classes = useStyles();

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
