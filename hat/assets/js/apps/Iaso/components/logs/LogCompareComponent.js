import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import isEqual from 'lodash/isEqual';

import {
    withStyles, Table, TableBody, TableCell, TableRow, Button, Paper,
} from '@material-ui/core';

import { getPolygonPositionsFromSimplifiedGeom } from '../../utils/orgUnitUtils';

import PolygonMap from '../maps/PolygonMapComponent';
import ConfirmDialog from '../dialogs/ConfirmDialogComponent';

const styles = theme => ({
    paper: {
        padding: theme.spacing(2),
        textAlign: 'center',
    },
    table: {
        marginBottom: theme.spacing(2),
    },
    cell: {
        width: 180,
    },
});

const LogCompareComponent = ({
    log, compareLog, classes, goToRevision,
}) => {
    const [all, seeAll] = React.useState(false);

    return (
        log.map((l, i) => (
            <Paper className={classes.paper} key={l.pk}>
                {
                    isEqual(l.fields, compareLog[i].fields)
                    && !all
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
                                            if (!isDifferent && !all) return null;
                                            if (key === 'simplified_geom' && currentField) {
                                                const polygonPositions = getPolygonPositionsFromSimplifiedGeom(currentField);
                                                return (
                                                    <TableRow key={key}>
                                                        <TableCell className={classes.cell}>{key}</TableCell>
                                                        <TableCell>
                                                            <PolygonMap polygonPositions={polygonPositions} />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            }
                                            return (
                                                <TableRow key={key}>
                                                    <TableCell className={classes.cell}>{key}</TableCell>
                                                    <TableCell>{currentField && currentField.toString().length > 0 ? currentField.toString() : '--'}</TableCell>
                                                </TableRow>
                                            );
                                        })
                                    }
                                </TableBody>
                            </Table>
                            <ConfirmDialog
                                btnMessage={(
                                    <FormattedMessage
                                        id="iaso.logs.goToRevision"
                                        defaultMessage="Reset to this revision"
                                    />
                                )}
                                message={(
                                    <FormattedMessage
                                        id="iaso.logs.goToRevisionQuestion"
                                        defaultMessage="Do you confirm the roll back to this revision ?"
                                    />
                                )}
                                confirm={() => goToRevision(l)}
                            />
                        </Fragment>
                    )
                }
            </Paper>
        ))
    );
};

LogCompareComponent.defaultProps = {
    compareLog: [],
};

LogCompareComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    log: PropTypes.array.isRequired,
    compareLog: PropTypes.array,
    goToRevision: PropTypes.func.isRequired,
};

export default withStyles(styles)(LogCompareComponent);
