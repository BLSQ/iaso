import React, { FunctionComponent } from 'react';
import { Grid } from '@mui/material';
import moment from 'moment';
import { TaskLog } from 'Iaso/domains/tasks/types';

export type Props = {
    messages: TaskLog[];
};

export const TaskLogMessages: FunctionComponent<Props> = ({ messages }) => {
    return (
        <>
            {messages.map(log => {
                return (
                    <Grid key={log.created_at} container spacing={0}>
                        <Grid
                            xs={2.5}
                            item
                            paddingTop={1.8}
                            style={{
                                color: 'grey',
                            }}
                        >
                            {moment.unix(log.created_at).format('LTS')}
                        </Grid>
                        <Grid item xs={9}>
                            <pre
                                style={{
                                    textWrap: 'wrap',
                                }}
                            >
                                {log.message}
                            </pre>
                        </Grid>
                    </Grid>
                );
            })}
        </>
    );
};
