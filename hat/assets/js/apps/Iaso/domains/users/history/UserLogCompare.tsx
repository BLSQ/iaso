import React, { FunctionComponent } from 'react';
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
import { MESSAGES as LOG_MESSAGES } from '../../orgUnits/history/messages';
import MESSAGES from '../messages';
import { UserLogValueWithErrorBoundary } from './UserLogValueWithErrorBoundary';

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
    Object.keys(objectItem)
        .filter(fieldKey => fieldKey !== 'user' && fieldKey !== 'account')
        .map(fieldKey => ({
            fieldKey,
            value: objectItem[fieldKey],
        }));

type LogValue = {
    pk: number;
    fields: {
        user: number;
        email: string;
        username: string;
        first_name: string;
        last_name: string;
        dhis2_id: string;
        language: 'fr' | 'en';
        phone_number: string;
        org_units: number[];
        projects: number[];
        user_roles: number[];
        home_page: string | null;
        user_permissions: string[];
    };
};
type NewLogValue = LogValue & {
    password_updated?: boolean;
};

type Props = {
    log: (LogValue | NewLogValue)[];
    compareLog: (LogValue | NewLogValue)[];
    title?: string;
};

export const UserLogCompare: FunctionComponent<Props> = ({
    log,
    compareLog,
    title,
}) => {
    const [showAllFields, setShowAllFields] = React.useState(false);
    const classes: Record<string, string> = useStyles();
    const differenceArray: any[] = [];
    const { formatMessage } = useSafeIntl();

    return (
        <>
            {log.map((l, i) => {
                const otherLog = compareLog[i];

                const diffFields = Object.fromEntries(
                    Object.entries(l.fields).filter(
                        ([key, value]) =>
                            !isEqual(value, otherLog && otherLog.fields[key]),
                    ),
                );
                if (
                    (diffFields?.password_updated as unknown as boolean) ===
                    false
                ) {
                    delete diffFields.password_updated;
                }

                differenceArray[i] = diffFields;
                const showFields = showAllFields ? l.fields : diffFields;
                const fields = getArrayfields(showFields);

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
                                    title={formatMessage(
                                        showAllFields
                                            ? LOG_MESSAGES.seeChanges
                                            : LOG_MESSAGES.seeAll,
                                    )}
                                >
                                    <IconButton
                                        className={classes.deleteIcon}
                                        color="inherit"
                                        onClick={() =>
                                            setShowAllFields(!showAllFields)
                                        }
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
                        {fields.length === 0 &&
                            formatMessage(LOG_MESSAGES.noDifference)}
                        <Table className={classes.table}>
                            <TableBody>
                                {fields.map(({ fieldKey, value }) => (
                                    <TableRow key={fieldKey}>
                                        <TableCell className={classes.cell}>
                                            {MESSAGES[fieldKey]
                                                ? formatMessage(
                                                      MESSAGES[fieldKey],
                                                  )
                                                : fieldKey}
                                        </TableCell>
                                        <TableCell
                                            className={
                                                showAllFields &&
                                                diffFields[fieldKey]
                                                    ? classes.isDifferent
                                                    : undefined
                                            }
                                        >
                                            <UserLogValueWithErrorBoundary
                                                // ts compiler gets confused with class component
                                                // @ts-ignore
                                                fieldKey={fieldKey}
                                                value={value ?? ''}
                                                isDifferent={Boolean(
                                                    showAllFields &&
                                                        diffFields[fieldKey],
                                                )}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                );
            })}
        </>
    );
};
