import { Grid, Typography } from '@material-ui/core';
import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';

import { isEmpty } from 'lodash';
import MESSAGES from '../../../constants/messages';

const formatIndicator = indicatorValue => {
    if (indicatorValue === null || indicatorValue === undefined)
        return indicatorValue;
    if (typeof indicatorValue === 'number') return indicatorValue.toFixed(0);
    if (typeof indicatorValue === 'string') return indicatorValue;
    if (indicatorValue.length) return indicatorValue.join(' -- ');
    return indicatorValue;
};

export const PreparednessSummary = ({ preparedness }) => {
    const { formatMessage } = useSafeIntl();
    if (!preparedness || isEmpty(preparedness)) return null;
    if (preparedness.status === 'error')
        return <Typography>Error: {preparedness.details}</Typography>;

    const createdAt = moment(preparedness.created_at);
    return (
        <>
            <Grid container direction="row">
                <Grid item md={4}>
                    <Typography>
                        {`${formatMessage(MESSAGES.national)}: ${
                            preparedness.national_score
                        }%`}
                    </Typography>
                </Grid>
                <Grid item md={4}>
                    <Typography>
                        {`${formatMessage(MESSAGES.regional)}: ${
                            preparedness.regional_score
                        }%`}
                    </Typography>
                </Grid>
                <Grid item md={4}>
                    <Typography>
                        {`${formatMessage(MESSAGES.districtScore)}: ${
                            preparedness.district_score
                        }%`}
                    </Typography>
                </Grid>
            </Grid>

            <Typography>
                <table>
                    <thead>
                        <tr>
                            <th>S/N</th>
                            <th>Indicator</th>
                            <th>National</th>
                            <th>Regions</th>
                            <th>Districts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {preparedness.indicators &&
                            Object.values(preparedness.indicators).map(
                                indicator => (
                                    <tr key={indicator.key}>
                                        <td>{indicator.sn}</td>
                                        <td>{indicator.title}</td>
                                        <td>
                                            {formatIndicator(
                                                indicator.national,
                                            )}
                                        </td>
                                        <td>
                                            {formatIndicator(indicator.regions)}
                                        </td>
                                        <td>
                                            {formatIndicator(
                                                indicator.districts,
                                            )}
                                        </td>
                                    </tr>
                                ),
                            )}
                    </tbody>
                </table>
                <Typography variant="caption">
                    {formatMessage(MESSAGES.spreadsheetImportTitle)}{' '}
                    {preparedness.title}. {formatMessage(MESSAGES.refreshedAt)}:{' '}
                    {createdAt.format('LTS')} ({createdAt.fromNow()})
                </Typography>
            </Typography>
        </>
    );
};
