import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    useSafeIntl,
    LoadingSpinner,
    commonStyles,
    Table,
} from 'bluesquare-components';
import TopBar from 'Iaso/components/nav/TopBarComponent';

import { redirectTo } from 'Iaso/routing/actions';
import { getRequest } from 'Iaso/libs/Api';
import tableColumns from './columns';
import MESSAGES from './messages';

const baseUrl = 'test';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const TestApp = () => {
    const dispatch = useDispatch();
    const classes = useStyles();
    const intl = useSafeIntl();
    const [fetching, setFetching] = useState(true);
    const [data, setData] = useState([]);
    const [count, setCount] = useState(0);
    const fetchData = async () => {
        const tempData = await getRequest('/api/test/blogpost/');
        setData(tempData);
        setCount(tempData.length);
        setFetching(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <>
            {fetching && <LoadingSpinner />}
            <TopBar
                title={intl.formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Table
                    data={data}
                    pages={1}
                    defaultSorted={[{ id: 'title', desc: false }]}
                    columns={tableColumns(intl.formatMessage, this)}
                    count={count}
                    baseUrl={baseUrl}
                    params={{}}
                    redirectTo={(key, params) =>
                        dispatch(redirectTo(key, params))
                    }
                />
            </Box>
        </>
    );
};

export default TestApp;
