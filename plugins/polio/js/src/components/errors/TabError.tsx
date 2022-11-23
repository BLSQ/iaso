import React, { FunctionComponent, useEffect, useState } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Typography, Grid } from '@material-ui/core';
import MESSAGES from '../../constants/messages';

type Props = {
    tabs: Array<any>;
    selectedTab: number;
    errors: Array<any>;
};

export const TabErrors: FunctionComponent<Props> = ({
    tabs,
    selectedTab,
    errors,
}) => {
    const { formatMessage } = useSafeIntl();
    const [errorMessages, setErrorMessages] = useState([]);

    const errorMessage = {
        title: tabs[selectedTab].title,
    };

    useEffect(() => {
        if (errors) {
            setErrorMessages([...errorMessages, errorMessage]);
        }
    }, [errors]);

    return (
        <Grid container justifyContent="flex-end">
            <Grid item md={6}>
                {errorMessages?.map(error => (
                    <Typography key="2" color="error">
                        {error.title}
                    </Typography>
                ))}
            </Grid>
        </Grid>
    );
};
