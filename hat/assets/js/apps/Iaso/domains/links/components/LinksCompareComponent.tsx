import React, { FunctionComponent } from 'react';
import isEqual from 'lodash/isEqual';

import { Table, TableBody, Paper, Grid, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    // @ts-ignore
    IconButton as IconButtonComponent,
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';
import { baseUrls } from '../../../constants/urls';
import { LinksValue } from './LinksValueComponent';
import MESSAGES from '../messages';
import { Link } from '../types';

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
                        <IconButtonComponent
                            url={`${baseUrls.orgUnitDetails}/orgUnitId/${link.id}/tab/infos`}
                            icon="orgUnit"
                            tooltipMessage={MESSAGES.details}
                        />
                    </Grid>
                </Grid>
            )}
            {isEqual(link, compareLink) && formatMessage(MESSAGES.noDifference)}
            {!isEqual(link, compareLink) && (
                <>
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
                </>
            )}
        </Paper>
    );
};
