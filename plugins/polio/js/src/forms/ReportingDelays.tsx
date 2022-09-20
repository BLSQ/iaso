import {
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    makeStyles,
} from '@material-ui/core';
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import classnames from 'classnames';
import { Field, useFormikContext } from 'formik';
import MESSAGES from '../constants/messages';
import { TextInput } from '../components/Inputs';

const useStyles = makeStyles(theme => ({
    rightCell: {
        // @ts-ignore
        borderLeft: `1px solid ${theme.palette.ligthGray.border}`,
        // fontWeight: 'bold',
    },
    title: {
        fontWeight: 'bold',
    },
    inputFields: { '& .MuiOutlinedInput-notchedOutline': { border: 'none' } },
}));

type Props = {
    accessor: string;
};

export const ReportingDelays: FunctionComponent<Props> = ({ accessor }) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const {
        values: { rounds = [] },
        setFieldValue,
    } = useFormikContext<any>(); // TODO add campaign typing
    return (
        <Paper elevation={0} variant="outlined">
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell className={classes.title}>
                            {formatMessage(MESSAGES.reportingDelays)}
                        </TableCell>
                        <TableCell
                            className={classnames(
                                classes.rightCell,
                                classes.title,
                            )}
                        >
                            {formatMessage(MESSAGES.days)}
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell>
                            {formatMessage(MESSAGES.healthCentreToDistrict)}
                        </TableCell>
                        <TableCell className={classes.rightCell}>
                            <Field
                                label=""
                                name={`${accessor}.reporting_delays_hc_to_district`}
                                component={TextInput}
                                className={classes.inputFields}
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>
                            {formatMessage(MESSAGES.districtToRegionalLevel)}
                        </TableCell>
                        <TableCell className={classes.rightCell}>
                            <Field
                                label=""
                                name={`${accessor}.reporting_delays_district_to_region`}
                                component={TextInput}
                                className={classes.inputFields}
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>
                            {formatMessage(MESSAGES.regionalToNationalLevel)}
                        </TableCell>
                        <TableCell className={classes.rightCell}>
                            <Field
                                label=""
                                name={`${accessor}.reporting_delays_region_to_national`}
                                component={TextInput}
                                className={classes.inputFields}
                            />
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </Paper>
    );
};
