/* eslint-disable react/require-default-props */
import { Box, Paper } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
import { useScopeAndDistrictsNotFound } from '../../pages/IM/requests';

type Props = {
    type: 'lqas' | 'imGlobal' | 'imIHH' | 'imOHH';
    campaign?: string;
    country?: number;
};

export const NoDataForBarChart: FunctionComponent<Props> = ({
    campaign,
    type,
    country,
}) => {
    const { data } = useScopeAndDistrictsNotFound(type, campaign, country);
    const { hasScope, districtsNotFound } = data[campaign] ?? {};
    return (
        <>
            {!hasScope && (
                // <div>
                //     {`I have a scope, missing districts: ${districtsNotFound}`}
                // </div>
                <Box>
                    <Paper elevation={1}>
                        No Data found. This campaign has no scope. Please define
                        one
                    </Paper>
                </Box>
            )}
            {hasScope && (
                <Box>
                    <Paper elevation={1}>
                        {`No data found in scope. Some districts need to be matched : ${districtsNotFound}. Please contact an admin`}
                    </Paper>
                </Box>
            )}
        </>
    );
};
