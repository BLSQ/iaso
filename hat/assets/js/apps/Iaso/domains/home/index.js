import React from 'react';
import { Box } from '@material-ui/core';
import { useQuery } from 'react-query';
import { commonStyles, LoadingSpinner } from 'bluesquare-components';
import { makeStyles } from '@material-ui/core/styles';
import { timeMonth } from 'd3-time';
import TopBar from '../../components/nav/TopBarComponent';
import { iasoGetRequest } from '../../utils/requests';
import moment from 'moment/moment';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    bar: { backgroundColor: theme.primary },
}));

const Home = () => {
    const classes = useStyles();
    const { data, isLoading } = useQuery(['instances', 'stats'], async () => {
        const result = await iasoGetRequest({
            requestParams: {
                url: '/api/instances/stats/',
            },
            disableSuccessSnackBar: true,
        });
        const rows = result.instances_per_month.map(([month, value]) => [
            new Date(month),
            value,
        ]);
        // Fill missing month
        // noinspection UnnecessaryLocalVariableJS
        const filled = timeMonth
            .range(rows[0][0], rows[rows.length - 1][0])
            .map(m => {
                // fuck timezone and fuck js
                const existing = rows.find(
                    r =>
                        r[0].getYear() === m.getYear() &&
                        r[0].getMonth() === m.getMonth(),
                );
                return existing || [m, 0];
            });
        return filled;
    });

    return (
        <>
            <TopBar title="Dashboard" />
            {isLoading && <LoadingSpinner />}
            <Box className={classes.containerFullHeightNoTabPadded}>
                Instances per month
                {data &&
                    data.map(([month, value]) => (
                        <div key={month}>
                            {moment(month).format('YYYY-MM')}{' '}
                            <span
                                style={{
                                    display: 'inline-block',
                                    color: 'black',
                                    backgroundColor: 'orange',
                                    width: value * 4,
                                    marginBottom: 2,
                                }}
                            >
                                {value}
                            </span>
                        </div>
                    ))}
                {/* <pre>{data && JSON.stringify(data, null, 2)}</pre>*/}
            </Box>
        </>
    );
};
export default Home;
