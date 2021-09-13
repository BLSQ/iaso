import React from 'react';
import { Box, makeStyles } from '@material-ui/core';
import { commonStyles } from 'bluesquare-components';
import TopBar from '../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';

import { CampaignsCalendar } from '../components/CampaignsCalendar';

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
const columns = [
    {
        value: '2021',
        columns: [
            {
                value: 'AUG',
                columns: [
                    {
                        value: '9',
                    },
                    {
                        value: '16',
                    },
                    {
                        value: '23',
                    },
                    {
                        value: '30',
                    },
                ],
            },
            {
                value: 'SEPT',
                columns: [
                    {
                        value: '6',
                    },
                    {
                        value: '13',
                    },
                    {
                        value: '20',
                    },
                    {
                        value: '27',
                    },
                ],
            },
            {
                value: 'OCT',
                colSpan: 4,
                columns: [
                    {
                        value: '4',
                    },
                    {
                        value: '11',
                    },
                    {
                        value: '18',
                    },
                    {
                        value: '25',
                    },
                ],
            },
            {
                value: 'NOV',
                columns: [
                    {
                        value: '1',
                    },
                    {
                        value: '8',
                    },
                    {
                        value: '15',
                    },
                    {
                        value: '22',
                    },
                ],
            },
        ],
    },
];
const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));
export const Calendar = () => {
    const classes = useStyles();
    return (
        <div>
            <TopBar title="Calendar" displayBackButton={false} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <CampaignsCalendar
                    columns={columns}
                    campaigns={campaigns}
                    currentWeekIndex={4}
                />
            </Box>
        </div>
    );
};
