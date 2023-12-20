import React from 'react';
import PropTypes from 'prop-types';

import {
    Table,
    TableBody,
    TableCell,
    TableRow,
    Paper,
    IconButton,
    Tooltip,
    Grid,
    Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import { useSafeIntl, commonStyles } from 'bluesquare-components';
import { isEqual } from 'lodash';

import ConfirmDialog from '../dialogs/ConfirmDialogComponent';

import ValueWithErrorBoundary from './ValueWithErrorBoundary';

import MESSAGES from '../../domains/forms/messages';
import { MESSAGES as LOG_MESSAGES } from './messages';

const useStyles = makeStyles(theme => ({
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
}));

const getArrayfields = objectItem =>
    Object.keys(objectItem).map(fieldKey => ({
        fieldKey,
        value: objectItem[fieldKey],
    }));

/* a Log is an array
 *  each item of the array  is a list of change in a model
 * with pk, fields and models. In effect at the moment there is only ever one.
 */

const LogCompareComponent = ({ log, compareLog, goToRevision, title }) => {
    const [showAllFields, setShowAllFields] = React.useState(false);
    const classes = useStyles();
    const differenceArray = [];
    const { formatMessage } = useSafeIntl();

    return log.map((l, i) => {
        const otherLog = compareLog[i];
        if (otherLog && l.pk !== otherLog.pk && l.model !== otherLog.model)
            return 'Error object is different';

        const diffFields = Object.fromEntries(
            Object.entries(l.fields).filter(
                ([key, value]) =>
                    !isEqual(value, otherLog && otherLog.fields[key]),
            ),
        );

        differenceArray[i] = diffFields;
        const showFields = showAllFields ? l.fields : diffFields;
        // This block convert to a list and
        // reorganize so that longitude is just after latitude
        const fieldsObject = {
            ...showFields,
        };
        const fullFields = getArrayfields(fieldsObject);
        const latIndex =
            fullFields.findIndex(field => field.fieldKey === 'latitude') + 1;
        const longitude = fullFields.find(
            field => field.fieldKey === 'longitude',
        );
        delete fieldsObject.longitude;
        let fields = getArrayfields(fieldsObject).slice(0, latIndex);
        if (longitude) {
            fields.push(longitude);
        }
        fields = fields.concat(getArrayfields(fieldsObject).slice(latIndex));
        // end block

        return (
            <Paper className={classes.paper} key={l.pk}>
                <Grid container spacing={0} className={classes.seeAll}>
                    <Grid
                        container
                        item
                        xs={6}
                        justifyContent="flex-start"
                        alignItems="center"
                    >
                        <Typography variant="h6" component="h6" color="primary">
                            {title}
                        </Typography>
                    </Grid>
                    <Grid
                        container
                        item
                        xs={6}
                        justifyContent="flex-end"
                        alignItems="center"
                    >
                        <Tooltip
                            title={formatMessage(
                                showAllFields
                                    ? LOG_MESSAGES.seeChanges
                                    : LOG_MESSAGES.seeAll,
                            )}
                        >
                            <IconButton
                                className={classes.deleteIcon}
                                color="inherit"
                                onClick={() => setShowAllFields(!showAllFields)}
                            >
                                {showAllFields ? (
                                    <VisibilityOff />
                                ) : (
                                    <Visibility />
                                )}
                            </IconButton>
                        </Tooltip>
                    </Grid>
                </Grid>
                {showFields.length === 0 &&
                    formatMessage(LOG_MESSAGES.noDifference)}
                <Table className={classes.table}>
                    <TableBody>
                        {fields.map(({ fieldKey, value }) => (
                            <TableRow key={fieldKey}>
                                <TableCell className={classes.cell}>
                                    {MESSAGES[fieldKey]
                                        ? formatMessage(MESSAGES[fieldKey])
                                        : fieldKey}
                                </TableCell>
                                <TableCell
                                    className={
                                        showAllFields && diffFields[fieldKey]
                                            ? classes.isDifferent
                                            : null
                                    }
                                >
                                    <ValueWithErrorBoundary
                                        fieldKey={fieldKey}
                                        value={value}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <Grid
                    container
                    spacing={2}
                    alignItems="center"
                    justifyContent="center"
                >
                    <Grid xs={6} item>
                        <ConfirmDialog
                            btnMessage={formatMessage(
                                LOG_MESSAGES.goToRevision,
                            )}
                            question={formatMessage(
                                LOG_MESSAGES.goToRevisionQuestion,
                            )}
                            message={formatMessage(
                                LOG_MESSAGES.goToRevisionText,
                            )}
                            confirm={() => goToRevision(l)}
                        />
                    </Grid>
                    <Grid xs={6} item>
                        <ConfirmDialog
                            btnMessage={formatMessage(
                                LOG_MESSAGES.goToRevisionChanges,
                            )}
                            question={formatMessage(
                                LOG_MESSAGES.goToRevisionQuestion,
                            )}
                            message={formatMessage(
                                LOG_MESSAGES.goToRevisionTextChanges,
                            )}
                            confirm={() =>
                                goToRevision({
                                    fields: differenceArray[i],
                                })
                            }
                        />
                    </Grid>
                </Grid>
            </Paper>
        );
    });
};

LogCompareComponent.defaultProps = {
    compareLog: [],
    title: '',
};

LogCompareComponent.propTypes = {
    log: PropTypes.array.isRequired,
    compareLog: PropTypes.array,
    goToRevision: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
};

export default LogCompareComponent;
