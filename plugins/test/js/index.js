import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles, Box } from '@material-ui/core';
import {
    useSafeIntl,
    LoadingSpinner,
    commonStyles,
    Table,
} from 'bluesquare-components';
import TopBar from '../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';

import tableColumns from './columns';
import MESSAGES from './messages';

import { redirectTo } from '../../../hat/assets/js/apps/Iaso/routing/actions';
import { getRequest } from '../../../hat/assets/js/apps/Iaso/libs/Api';

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
