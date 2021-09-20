import React, { useMemo, useState } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import classnames from 'classnames';

import {
    Table,
    TableContainer,
    Box,
    Button,
    FormControlLabel,
    Switch,
} from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';

import { redirectToReplace } from '../../../../../../hat/assets/js/apps/Iaso/routing/actions';

import { useStyles } from './Styles';
import { baseUrl, dateFormat } from './constants';
import { getCalendarData, mapCampaigns } from './utils';

import { Head } from './Head';
import { Body } from './Body';

import MESSAGES from '../../constants/messages';

const CampaignsCalendar = ({ campaigns, params }) => {
    const { formatMessage } = useSafeIntl();
    const [allCampaigns, setAllcampaigns] = useState(false);
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

    const mappedCampaigns = useMemo(() => mapCampaigns(campaigns), [campaigns]);
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
        <>
            <Box display="flex" justifyContent="flex-end">
                <FormControlLabel
                    control={
                        <Switch
                            checked={allCampaigns}
                            onChange={event =>
                                setAllcampaigns(event.target.checked)
                            }
                        />
                    }
                    label={formatMessage(MESSAGES.displayAllCampaigns)}
                />
            </Box>
            <Box
                mb={2}
                mt={2}
                display="flex"
                alignItems="flex-start"
                position="relative"
            >
                <Box className={classes.nav}>
                    <Button
                        onClick={handleGoPrev}
                        className={classnames(
                            classes.navButton,
                            classes.navButtonPrev,
                        )}
                        size="large"
                        variant="outlined"
                        color="primary"
                    >
                        <ChevronLeft />
                    </Button>
                    <Button
                        onClick={handleGoNext}
                        className={classes.navButton}
                        size="large"
                        variant="outlined"
                        color="primary"
                    >
                        <ChevronRight color="primary" />
                    </Button>
                </Box>
                <TableContainer className={classes.tableContainer}>
                    <Table stickyHeader>
                        <Head headers={headers} />
                        <Body
                            campaigns={mappedCampaigns}
                            currentWeekIndex={currentWeekIndex}
                            firstMonday={firstMonday}
                            lastSunday={lastSunday}
                            allCampaigns={allCampaigns}
                        />
                    </Table>
                </TableContainer>
            </Box>
        </>
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
