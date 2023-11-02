import React, { FunctionComponent } from 'react';
import { Box, makeStyles } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import classNames from 'classnames';
import { SingleSelect } from '../../../../../components/Inputs/SingleSelect';

type Props = { className?: string };
const useStyles = makeStyles(theme => ({ ...commonStyles(theme) }));

export const VaccineRequestForm: FunctionComponent<Props> = ({ className }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { values, touched, errors, setFieldValue } = useFormikContext<any>();
    return (
        <Box
            className={classNames(
                className,
                classes.containerFullHeightNoTabPadded,
            )}
        >
            <Field
                label="country.name"
                name="country.name"
                component={SingleSelect}
                disabled={false}
                // onChange={() => null}
            />
        </Box>
    );
};
