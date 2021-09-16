import React, { useMemo } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

import { Table, TableContainer, Box, IconButton } from '@material-ui/core';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';

import { redirectToReplace } from '../../../../../../hat/assets/js/apps/Iaso/routing/actions';

import { useStyles } from './Styles';
import { baseUrl, dateFormat } from './constants';
import { getCalendarData, mapCampaigns } from './utils';

import { Head } from './Head';
import { Body } from './Body';

const testCampaigns = [
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
    {
        id: 4,
        r1WeekIndex: [1, 2],
        campaignWeeks: 6,
    },
];

const CampaignsCalendar = ({ campaigns, params }) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const currentDate = params.currentDate
        ? moment(params.currentDate, dateFormat)
        : moment();

    const currentMonday = currentDate.clone().startOf('isoWeek');
    const { headers, currentWeekIndex, firstMonday, lastSunday } = useMemo(
        () => getCalendarData(currentMonday),
        [currentMonday],
    );

    const mapeedCampaigns = useMemo(() => mapCampaigns(campaigns), [campaigns]);
    const handleGoNext = () => {
        const newDate = currentMonday.clone().add(4, 'week');
        dispatch(
            redirectToReplace(baseUrl, {
                currentDate: newDate.format(dateFormat),
            }),
        );
    };
    const handleGoPrev = () => {
        const newDate = currentMonday.clone().subtract(4, 'week');
        dispatch(
            redirectToReplace(baseUrl, {
                currentDate: newDate.format(dateFormat),
            }),
        );
    };

    return (
        <Box mb={2} mt={2} display="flex" alignItems="flex-start">
            <IconButton onClick={handleGoPrev} className={classes.navButton}>
                <ChevronLeft color="primary" />
            </IconButton>
            <TableContainer className={classes.tableContainer}>
                <Table>
                    <Head headers={headers} />
                    <Body
                        // campaigns={testCampaigns}
                        campaigns={mapeedCampaigns}
                        currentWeekIndex={currentWeekIndex}
                        firstMonday={firstMonday}
                        lastSunday={lastSunday}
                    />
                </Table>
            </TableContainer>

            <IconButton onClick={handleGoNext} className={classes.navButton}>
                <ChevronRight color="primary" />
            </IconButton>
        </Box>
    );
};

CampaignsCalendar.defaultProps = {
    campaigns: [],
};

CampaignsCalendar.propTypes = {
    campaigns: PropTypes.array,
    params: PropTypes.object.isRequired,
};

export { CampaignsCalendar };
