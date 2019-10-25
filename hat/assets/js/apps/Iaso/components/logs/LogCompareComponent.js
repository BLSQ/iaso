import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import isEqual from 'lodash/isEqual';

import {
    withStyles, Table, TableBody, TableCell, TableRow, Paper, IconButton, Tooltip, Grid, Typography,
} from '@material-ui/core';
import RemoveRedEye from '@material-ui/icons/RemoveRedEye';

import { getPolygonPositionsFromSimplifiedGeom } from '../../utils/orgUnitUtils';

import PolygonMap from '../maps/PolygonMapComponent';
import ConfirmDialog from '../dialogs/ConfirmDialogComponent';
import commonStyles from '../../styles/common';

const styles = theme => ({
    ...commonStyles(theme),
    paper: {
        padding: theme.spacing(2),
        textAlign: 'center',
    },
    table: {
        marginBottom: theme.spacing(2),
    },
    cell: {
        minWidth: 180,
    },
    isDifferent: {
        backgroundColor: theme.palette.secondary.main,
        color: 'white',
    },
    seeAll: {
        marginBottom: theme.spacing(1),
    },
    marginRight: {
        marginRight: theme.spacing(2),
        display: 'inline-block',
    },
});

const LogCompareComponent = ({
    log, compareLog, classes, goToRevision, title,
}) => {
    const [allFields, seeAllFields] = React.useState(false);

    const differenceArray = [];

    return (
        log.map((l, i) => {
            differenceArray.push({});
            return (
                <Paper className={classes.paper} key={l.pk}>
                    {!isEqual(l.fields, compareLog[i].fields)
                        && (
                            <Grid container spacing={0} className={classes.seeAll}>
                                <Grid container item xs={6} justify="flex-start" alignItems="center">
                                    <Typography variant="h6" component="h6" color="primary">
                                        {title}
                                    </Typography>
                                </Grid>
                                <Grid container item xs={6} justify="flex-end" alignItems="center">
<<<<<<< HEAD
                                    <Tooltip title={
                                        allFields
                                            ? <FormattedMessage id="iaso.label.seeChanges" defaultMessage="See only changes" />
                                            : <FormattedMessage id="iaso.label.seeAll" defaultMessage="See all fields" />
                                    }
=======
                                    <Tooltip
                                        classes={{
                                            popper: classes.popperFixed,
                                        }}
                                        title={
                                            allFields
                                                ? <FormattedMessage id="iaso.logs.seeChanges" defaultMessage="See only changes" />
                                                : <FormattedMessage id="iaso.logs.seeAll" defaultMessage="See all fields" />
                                        }
>>>>>>> filters
                                    >
                                        <IconButton
                                            className={classes.deleteIcon}
                                            color="inherit"
                                            onClick={() => seeAllFields(!allFields)}
                                        >
                                            <RemoveRedEye />
                                        </IconButton>
                                    </Tooltip>
                                </Grid>
                            </Grid>
                        )
                    }
                    {
                        isEqual(l.fields, compareLog[i].fields)
                        && !allFields
                        && (
                            <FormattedMessage
                                id="iaso.logs.noDifference"
                                defaultMessage="No difference between revisions"
                            />
                        )
                    }
                    {
                        !isEqual(l.fields, compareLog[i].fields)
                        && (
                            <Fragment>
                                <Table className={classes.table}>
                                    <TableBody>
                                        {
                                            Object.keys(l.fields).map((key) => {
                                                const currentField = l.fields[key];
                                                let isDifferent = false;
                                                if (Array.isArray(currentField)) {
                                                    currentField.forEach((f, index) => {
                                                        if (f && compareLog[i] && f !== compareLog[i].fields[key][index]) {
                                                            isDifferent = true;
                                                        }
                                                    });
                                                } else {
                                                    isDifferent = compareLog[i] && compareLog[i].fields[key] !== currentField;
                                                }
                                                isDifferent = isDifferent && l.pk === compareLog[i].pk && l.model === compareLog[i].model;
                                                if (!isDifferent && !allFields) return null;
                                                differenceArray[i][key] = currentField;
                                                if (key === 'simplified_geom' && currentField) {
                                                    const polygonPositions = getPolygonPositionsFromSimplifiedGeom(currentField);
                                                    return (
                                                        <TableRow key={key}>
                                                            <TableCell className={classes.cell}>
                                                                {key}
                                                            </TableCell>
                                                            <TableCell className={isDifferent && allFields ? classes.isDifferent : null}>
                                                                <PolygonMap polygonPositions={polygonPositions} />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                }
                                                return (
                                                    <TableRow key={key}>
                                                        <TableCell className={classes.cell}>{key}</TableCell>
                                                        <TableCell className={isDifferent && allFields ? classes.isDifferent : null}>
                                                            {currentField && currentField.toString().length > 0 ? currentField.toString() : '--'}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        }
                                    </TableBody>
                                </Table>

                                <Grid container spacing={2} alignItems="center" justify="center">
                                    <Grid xs={6} item>
                                        <ConfirmDialog
                                            btnMessage={(
                                                <FormattedMessage
                                                    id="iaso.logs.goToRevision"
                                                    defaultMessage="Keep all"
                                                />
                                            )}
                                            question={(
                                                <FormattedMessage
                                                    id="iaso.logs.goToRevisionQuestion"
                                                    defaultMessage="Do you confirm the roll back to this revision ?"
                                                />
                                            )}
                                            message={(
                                                <FormattedMessage
                                                    id="iaso.logs.goToRevisionText"
                                                    defaultMessage="All fiieds will be replaced"
                                                />
                                            )}
                                            confirm={() => goToRevision(l)}
                                        />
                                    </Grid>
                                    <Grid xs={6} item>
                                        <ConfirmDialog
                                            btnMessage={(
                                                <FormattedMessage
                                                    id="iaso.logs.goToRevisionChanges"
                                                    defaultMessage="Keep only changes"
                                                />
                                            )}
                                            question={(
                                                <FormattedMessage
                                                    id="iaso.logs.goToRevisionQuestion"
                                                    defaultMessage="Do you confirm the roll back to this revision ?"
                                                />
                                            )}
                                            message={(
                                                <FormattedMessage
                                                    id="iaso.logs.goToRevisionTextChanges"
                                                    defaultMessage="Only changes will be applied"
                                                />
                                            )}
                                            confirm={() => goToRevision({
                                                fields: differenceArray[i],
                                            })}
                                        />

                                    </Grid>
                                </Grid>
                            </Fragment>
                        )
                    }
                </Paper>
            );
        })
    );
};

LogCompareComponent.defaultProps = {
    compareLog: [],
    title: '',
};

LogCompareComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    log: PropTypes.array.isRequired,
    compareLog: PropTypes.array,
    goToRevision: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
};

export default withStyles(styles)(LogCompareComponent);
