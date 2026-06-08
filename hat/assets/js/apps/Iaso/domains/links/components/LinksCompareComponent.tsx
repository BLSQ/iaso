import React, { FunctionComponent } from 'react';

import { Table, TableBody, Paper, Grid, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import isEqual from 'lodash/isEqual';
import { baseUrls } from '../../../constants/urls';
import MESSAGES from '../messages';
import { Link } from '../types';
import { LinksValue } from './LinksValueComponent';

const useStyles = makeStyles(theme => ({
    paper: {
        padding: theme.spacing(2),
        textAlign: 'center',
    },
    table: {
        marginBottom: theme.spacing(2),
    },
    title: {
        marginBottom: theme.spacing(1),
    },
}));

type Props = {
    link: Link;
    compareLink: Link;
    title?: string;
    validated?: boolean;
};

export const LinksCompare: FunctionComponent<Props> = ({
    link,
    compareLink,
    title = '',
    validated = false,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Paper className={classes.paper}>
            {!isEqual(link, compareLink) && (
                <Grid
                    container
                    spacing={0}
                    alignItems="center"
                    justifyContent="flex-start"
                    className={classes.title}
                >
                    <Grid item xs={11}>
                        <Typography variant="h6" component="h6" color="primary">
                            {`${title} - ${link.source}`}
                        </Typography>
                    </Grid>
                    <Grid item xs={1}>
                        <IconButton
                            url={`/${baseUrls.orgUnitDetails}/orgUnitId/${link.id}/tab/infos`}
                            icon="orgUnit"
                            tooltipMessage={MESSAGES.details}
                        />
                    </Grid>
                </Grid>
            )}
            {isEqual(link, compareLink) && formatMessage(MESSAGES.noDifference)}
            {!isEqual(link, compareLink) && (
                <Table className={classes.table}>
                    <TableBody>
                        {Object.keys(link).map(key => {
                            const value = link[key];
                            const isDifferent = !isEqual(
                                value,
                                compareLink[key],
                            );
                            return (
                                <LinksValue
                                    key={key}
                                    link={link}
                                    linkKey={key}
                                    value={value}
                                    isDifferent={isDifferent}
                                    validated={validated}
                                />
                            );
                        })}
                    </TableBody>
                </Table>
            )}
        </Paper>
    );
};
