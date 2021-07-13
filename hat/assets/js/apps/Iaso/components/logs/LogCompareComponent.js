import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import moment from 'moment';

import isEqual from 'lodash/isEqual';

import {
    withStyles,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Paper,
    IconButton,
    Tooltip,
    Grid,
    Typography,
} from '@material-ui/core';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

import {
    textPlaceholder,
    injectIntl,
    commonStyles,
} from 'bluesquare-components';
import { getPolygonPositionsFromSimplifiedGeom } from '../../domains/orgUnits/utils';

import PolygonMap from '../maps/PolygonMapComponent';
import MarkerMap from '../maps/MarkerMapComponent';
import ConfirmDialog from '../dialogs/ConfirmDialogComponent';

import MESSAGES from '../../domains/forms/messages';
import { MESSAGES as LOG_MESSAGES } from './messages';

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
    cellMap: {
        margin: -theme.spacing(2),
    },
});

const renderValue = (fieldKey, value, fields, classes) => {
    if (!value || value.toString().length === 0) return textPlaceholder;
    switch (fieldKey) {
        case 'simplified_geom': {
            const polygonPositions =
                getPolygonPositionsFromSimplifiedGeom(value);
            return (
                <div className={classes.cellMap}>
                    <PolygonMap polygonPositions={polygonPositions} />
                </div>
            );
        }
        case 'updated_at': {
            return moment(value).format('LTS');
        }

        case 'location': {
            if (!fields.latitude || !fields.longitude) {
                return value.toString();
            }
            return (
                <div className={classes.cellMap}>
                    <MarkerMap
                        latitude={fields.latitude}
                        longitude={fields.longitude}
                    />
                </div>
            );
        }

        default:
            return value.toString();
    }
};

const getArrayfields = objectItem =>
    Object.keys(objectItem).map(fieldKey => ({
        fieldKey,
        value: objectItem[fieldKey],
    }));

const LogCompareComponent = ({
    log,
    compareLog,
    classes,
    goToRevision,
    title,
    intl,
}) => {
    const [allFields, seeAllFields] = React.useState(false);

    const differenceArray = [];
    const { formatMessage } = intl;

    return log.map((l, i) => {
        differenceArray.push({});
        const fieldsObject = {
            ...l.fields,
        };
        const fullFields = getArrayfields(l.fields);
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
        const fieldEquals =
            compareLog[i] && isEqual(l.fields, compareLog[i].fields);
        return (
            <Paper className={classes.paper} key={l.pk}>
                {!fieldEquals && (
                    <Grid container spacing={0} className={classes.seeAll}>
                        <Grid
                            container
                            item
                            xs={6}
                            justifyContent="flex-start"
                            alignItems="center"
                        >
                            <Typography
                                variant="h6"
                                component="h6"
                                color="primary"
                            >
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
                                classes={{
                                    popper: classes.popperFixed,
                                }}
                                title={
                                    allFields ? (
                                        <FormattedMessage
                                            {...LOG_MESSAGES.seeChanges}
                                        />
                                    ) : (
                                        <FormattedMessage
                                            {...LOG_MESSAGES.seeAll}
                                        />
                                    )
                                }
                            >
                                <IconButton
                                    className={classes.deleteIcon}
                                    color="inherit"
                                    onClick={() => seeAllFields(!allFields)}
                                >
                                    {allFields ? (
                                        <VisibilityOff />
                                    ) : (
                                        <Visibility />
                                    )}
                                </IconButton>
                            </Tooltip>
                        </Grid>
                    </Grid>
                )}
                {fieldEquals && !allFields && (
                    <FormattedMessage {...LOG_MESSAGES.noDifference} />
                )}
                {!fieldEquals && (
                    <>
                        <Table className={classes.table}>
                            <TableBody>
                                {fields.map(field => {
                                    if (field) {
                                        const { value, fieldKey } = field;
                                        let isDifferent = false;
                                        if (Array.isArray(value)) {
                                            value.forEach((f, index) => {
                                                if (
                                                    f &&
                                                    compareLog[i] &&
                                                    f !==
                                                        compareLog[i].fields[
                                                            fieldKey
                                                        ][index]
                                                ) {
                                                    isDifferent = true;
                                                }
                                            });
                                        } else {
                                            isDifferent =
                                                compareLog[i] &&
                                                compareLog[i].fields[
                                                    fieldKey
                                                ] !== value;
                                        }
                                        isDifferent =
                                            isDifferent &&
                                            l.pk === compareLog[i].pk &&
                                            l.model === compareLog[i].model;
                                        if (!isDifferent && !allFields)
                                            return null;
                                        differenceArray[i][fieldKey] = value;
                                        if (
                                            (fieldKey === 'simplified_geom' ||
                                                fieldKey === 'catchment') &&
                                            value
                                        ) {
                                            const polygonPositions =
                                                getPolygonPositionsFromSimplifiedGeom(
                                                    value,
                                                );
                                            return (
                                                <TableRow key={fieldKey}>
                                                    <TableCell
                                                        className={classes.cell}
                                                    >
                                                        {fieldKey}
                                                    </TableCell>
                                                    <TableCell
                                                        className={
                                                            isDifferent &&
                                                            allFields
                                                                ? classes.isDifferent
                                                                : null
                                                        }
                                                    >
                                                        <PolygonMap
                                                            polygonPositions={
                                                                polygonPositions
                                                            }
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        }
                                        return (
                                            <TableRow key={fieldKey}>
                                                <TableCell
                                                    className={classes.cell}
                                                >
                                                    {MESSAGES[fieldKey] &&
                                                        formatMessage(
                                                            MESSAGES[fieldKey],
                                                        )}
                                                    {!MESSAGES[fieldKey] &&
                                                        fieldKey}
                                                </TableCell>
                                                <TableCell
                                                    className={
                                                        isDifferent && allFields
                                                            ? classes.isDifferent
                                                            : null
                                                    }
                                                >
                                                    {renderValue(
                                                        fieldKey,
                                                        value,
                                                        l.fields,
                                                        classes,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }
                                    return null;
                                })}
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
                                    btnMessage={
                                        <FormattedMessage
                                            {...LOG_MESSAGES.goToRevision}
                                        />
                                    }
                                    question={
                                        <FormattedMessage
                                            {...LOG_MESSAGES.goToRevisionQuestion}
                                        />
                                    }
                                    message={
                                        <FormattedMessage
                                            {...LOG_MESSAGES.goToRevisionText}
                                        />
                                    }
                                    confirm={() => goToRevision(l)}
                                />
                            </Grid>
                            <Grid xs={6} item>
                                <ConfirmDialog
                                    btnMessage={
                                        <FormattedMessage
                                            {...LOG_MESSAGES.goToRevisionChanges}
                                        />
                                    }
                                    question={
                                        <FormattedMessage
                                            {...LOG_MESSAGES.goToRevisionQuestion}
                                        />
                                    }
                                    message={
                                        <FormattedMessage
                                            {...LOG_MESSAGES.goToRevisionTextChanges}
                                        />
                                    }
                                    confirm={() =>
                                        goToRevision({
                                            fields: differenceArray[i],
                                        })
                                    }
                                />
                            </Grid>
                        </Grid>
                    </>
                )}
            </Paper>
        );
    });
};

LogCompareComponent.defaultProps = {
    compareLog: [],
    title: '',
};

LogCompareComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    log: PropTypes.array.isRequired,
    compareLog: PropTypes.array,
    goToRevision: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
};

export default withStyles(styles)(injectIntl(LogCompareComponent));
