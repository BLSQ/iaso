import React, { FunctionComponent, useMemo } from 'react';
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
import ValueWithErrorBoundary from '../../orgUnits/history/ValueWithErrorBoundary';
import { MESSAGES as LOG_MESSAGES } from '../../orgUnits/history/messages';
import MESSAGES from '../messages';
// import { User } from '../../../utils/usersUtils';
import { NameAndId } from '../../../types/utils';

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

type LogValue = {
    user: {
        id: number;
        email: string;
        username: string;
        first_name: string;
        last_name: string;
        dhis2_id: string;
        language: 'fr' | 'en';
        phone_number: string;
        org_units: number[];
        projects: NameAndId[];
        user_roles: NameAndId[];
        home_page: string | null;
        user_permissions: string[];
    };
};
type NewLogValue = LogValue & {
    password_updated?: boolean;
};

// type UserLog = {
//     id: number;
//     content_type: string;
//     object_id: string; // profile id as string
//     source: string;
//     created_at: string; // date time
//     user: User;
//     past_value: LogValue[];
//     new_value: NewLogValue[];
// };

type Props = {
    log: LogValue | NewLogValue;
    otherLog: LogValue | NewLogValue;
    title?: string;
};

export const UserLogCompare: FunctionComponent<Props> = ({
    log,
    otherLog,
    title,
}) => {
    const [showAllFields, setShowAllFields] = React.useState(false);
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    // const diffFields = Object.fromEntries(
    //     Object.entries(log.fields).filter(
    //         ([key, value]) => !isEqual(value, otherLog && otherLog.fields[key]),
    //     ),
    // );
    const logKeys = useMemo(() => Object.keys(log), [log]);

    const diffFields: any = useMemo(() => {
        const result = {};
        logKeys.forEach(logKey => {
            if (logKey !== 'password_updated') {
                const logValue = log[logKey];
                const otherLogValue = otherLog[logKey];
                if (!isEqual(logValue, otherLogValue)) {
                    result[logKey] = true;
                } else {
                    result[logKey] = false;
                }
            }
        });
        return result;
    }, [log, logKeys, otherLog]);

    const diffKeys: any[] = useMemo(
        () => Object.keys(diffFields),
        [diffFields],
    );

    const fields = useMemo(() => {
        return showAllFields ? getArrayfields(log) : getArrayfields(diffFields);
    }, [diffFields, log, showAllFields]);

    const noDiff = showAllFields ? logKeys.length === 0 : diffKeys.length === 0;

    return (
        <Paper className={classes.paper}>
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
                            {showAllFields ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                    </Tooltip>
                </Grid>
            </Grid>
            {noDiff && formatMessage(LOG_MESSAGES.noDifference)}
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
                                        : undefined
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
            />
        </Paper>
    );
};
