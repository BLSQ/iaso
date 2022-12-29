import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import moment from 'moment';

import {
    makeStyles,
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
    useSafeIntl,
    commonStyles,
} from 'bluesquare-components';
import { isEqual } from 'lodash';
import { getPolygonPositionsFromSimplifiedGeom } from '../../domains/orgUnits/utils';

import PolygonMap from '../maps/PolygonMapComponent';
import { MarkerMap } from '../maps/MarkerMapComponent.tsx';
import ConfirmDialog from '../dialogs/ConfirmDialogComponent';

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
    cellMap: {
        margin: -theme.spacing(2),
    },
}));

const renderValue = (fieldKey, value, fields, classes) => {
    if (!value || value.toString().length === 0) return textPlaceholder;
    try {
        switch (fieldKey) {
            case 'geom':
            case 'catchment':
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
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Could not parse', e);
        return value.toString();
    }
};

// Use an errorBoundary so if the value cannot be parsed and crash when rendering
// we still display the raw value
class ValueWithErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        console.error(error);
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <>
                    <h1>Error rendering value:</h1>
                    <div>${this.props.value}</div>
                </>
            );
        }
        return renderValue(
            this.props.fieldKey,
            this.props.value,
            this.props.fields,
            this.props.classes,
        );
    }
}
ValueWithErrorBoundary.propTypes = {
    value: PropTypes.any,
    fieldKey: PropTypes.string.isRequired,
    fields: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
};

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
                {showFields.length === 0 && (
                    <FormattedMessage {...LOG_MESSAGES.noDifference} />
                )}
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
                                        fields={l.fields}
                                        classes={classes}
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
