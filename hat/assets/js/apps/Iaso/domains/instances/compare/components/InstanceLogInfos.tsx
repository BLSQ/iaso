/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';

import { Grid, Typography } from '@material-ui/core';
import { usePrettyPeriod } from '../../../periods/utils';
import { IntlFormatMessage } from '../../../../types/intl';
import WidgetPaper from '../../../../components/papers/WidgetPaperComponent';

import MESSAGES from '../messages';

type Props = {
    user: string | undefined;
    infos: Record<string, any> | undefined;
};

const PrettyPeriod = ({ value }) => {
    const formatPeriod = usePrettyPeriod();
    return formatPeriod(value);
};

export const InstanceLogInfos: FunctionComponent<Props> = ({ user, infos }) => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();

    return (
        <>
            <WidgetPaper
                expandable
                isExpanded={false}
                title={formatMessage(MESSAGES.infos)}
                padded
            >
                <Grid container spacing={1}>
                    <Grid
                        xs={5}
                        container
                        alignItems="center"
                        item
                        justifyContent="flex-end"
                    >
                        <Typography variant="body2" color="inherit">
                            {formatMessage(MESSAGES.last_modified_by)}
                        </Typography>
                        :
                    </Grid>
                    <Grid
                        xs={7}
                        container
                        item
                        justifyContent="flex-start"
                        alignItems="center"
                    >
                        <Typography variant="body2" color="inherit">
                            {user}
                        </Typography>
                    </Grid>
                </Grid>

                {Object.entries(infos).map(info => (
                    <Grid container spacing={1}>
                        <Grid
                            xs={5}
                            container
                            alignItems="center"
                            item
                            justifyContent="flex-end"
                        >
                            <Typography variant="body2" color="inherit">
                                {formatMessage(MESSAGES[info[0]])}
                            </Typography>
                            :
                        </Grid>
                        <Grid
                            xs={7}
                            container
                            item
                            justifyContent="flex-start"
                            alignItems="center"
                        >
                            <Typography variant="body2" color="inherit">
                                {info[0] === 'period' ? (
                                    <PrettyPeriod value={info[1]} />
                                ) : (
                                    info[1]
                                )}
                            </Typography>
                        </Grid>
                    </Grid>
                ))}
            </WidgetPaper>
        </>
    );
};
