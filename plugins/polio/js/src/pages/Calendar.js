import React from 'react';
import PropTypes from 'prop-types';
import { Box, makeStyles } from '@material-ui/core';
import moment from 'moment';
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

const Calendar = ({ params }) => {
    const classes = useStyles();
    const colsCount = 16;
    const currentDate = moment(params.currentDate, 'YYYY-MM-DD');
    const currentMonday = currentDate.clone().startOf('isoWeek');
    const firstMonday = currentMonday.clone().subtract(3, 'week');
    // const lastMonday = currentMonday.clone().add(12, 'week');
    const weeks = [
        {
            year: firstMonday.format('YYYY'),
            month: firstMonday.format('MM'),
            day: firstMonday.format('DD'),
        },
    ];

    Array(colsCount - 1)
        .fill()
        .forEach((_, i) => {
            const index = i + 1;
            const newMonday = firstMonday.clone().add(index, 'week');
            weeks.push({
                year: newMonday.format('YYYY'),
                month: newMonday.format('MM'),
                day: newMonday.format('DD'),
            });
        });

    const cols = [];

    weeks.forEach(w => {
        if (!cols.find(c => c.value === w.year)) {
            cols.push({
                value: w.year,
                columns: [],
            });
        } else if (!cols.find(c => c.columns.find(c => c.value === w.month))) {
        }
    });

    // console.log('currentDate', currentDate.format('LTS'));
    // console.log('currentMonday', currentMonday.format('LTS'));
    // console.log('firstMonday', firstMonday.format('LTS'));
    const years = [];
    weeks.forEach(w => {
        if (!years.includes(w.year)) {
            years.push(w.year);
        }
    });
    const months = [];
    weeks.forEach(w => {
        if (!months.includes(w.month)) {
            months.push(w.month);
        }
    });
    console.log('weeks', weeks);
    console.log('years', years);
    console.log('months', months);
    return (
        <div>
            <TopBar title="Calendar" displayBackButton={false} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <CampaignsCalendar
                    columns={columns}
                    campaigns={campaigns}
                    currentWeekIndex={4}
                    colsCount={colsCount}
                />
            </Box>
        </div>
    );
};

Calendar.propTypes = {
    params: PropTypes.object.isRequired,
};

export { Calendar };
