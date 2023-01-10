import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import isEqual from 'lodash/isEqual';

import {
    makeStyles,
    Table,
    TableBody,
    Paper,
    Grid,
    Typography,
} from '@material-ui/core';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import { baseUrls } from '../../../constants/urls';
import { LinksValue } from './LinksValueComponent';

import MESSAGES from '../messages';

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

export const LinksCompare = ({ link, compareLink, title, validated }) => {
    const classes = useStyles();
    const differenceArray = [{}];
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
            {isEqual(link, compareLink) && (
                <FormattedMessage {...MESSAGES.noDifference} />
            )}
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
                                differenceArray[key] = value;
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
