import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import isEqual from 'lodash/isEqual';

import {
    withStyles,
    Table,
    TableBody,
    Paper,
    Grid,
    Typography,
} from '@material-ui/core';

import LinksValue from './LinksValueComponent';

import MESSAGES from '../messages';

const styles = theme => ({
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
});

const LinksCompare = ({ link, compareLink, classes, title, validated }) => {
    const differenceArray = [{}];
    return (
        <Paper className={classes.paper}>
            {!isEqual(link, compareLink) && (
                <Grid container spacing={0} className={classes.title}>
                    <Grid
                        container
                        item
                        xs={6}
                        justify="flex-start"
                        alignItems="center"
                    >
                        <Typography variant="h6" component="h6" color="primary">
                            {title} -
{link.source}
                        </Typography>
                    </Grid>
                </Grid>
            )}
            {isEqual(link, compareLink) && (
                <FormattedMessage {...MESSAGES.noDifference} />
            )}
            {!isEqual(link, compareLink) && (
                <Fragment>
                    <Table className={classes.table}>
                        <TableBody>
                            {Object.keys(link).map(key => {
                                const value = link[key];
                                const isDifferent = !isEqual(
                                    value,
                                    compareLink[key],
                                );
                                differenceArray[key] = value;
                                return (
                                    <LinksValue
                                        key={key}
                                        linkKey={key}
                                        value={value}
                                        isDifferent={isDifferent}
                                        validated={validated}
                                    />
                                );
                            })}
                        </TableBody>
                    </Table>
                </Fragment>
            )}
        </Paper>
    );
};

LinksCompare.defaultProps = {
    title: '',
    validated: false,
};

LinksCompare.propTypes = {
    classes: PropTypes.object.isRequired,
    link: PropTypes.object.isRequired,
    compareLink: PropTypes.object.isRequired,
    title: PropTypes.string,
    validated: PropTypes.bool,
};

export default withStyles(styles)(LinksCompare);
