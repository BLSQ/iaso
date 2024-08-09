/* eslint-disable camelcase */
import { Box } from '@mui/material';
import React, { ReactElement } from 'react';
import { makeStyles } from '@mui/styles';
import { textPlaceholder } from 'bluesquare-components';
import { Link } from 'react-router-dom';
import { LinkToForm } from '../../forms/components/LinkToForm';
import { baseUrls } from '../../../constants/urls';

const useStyles = makeStyles(() => ({
    root: {
        overflowWrap: 'anywhere',
    },
}));

export const FormsCell = (cellInfo: {
    value?: { count: number; forms: { id: number; name: string }[] };
}): ReactElement => {
    const { count = 0, forms } = cellInfo?.value ?? {};
    const classes = useStyles();
    if (count === 0) {
        return <Box>{textPlaceholder}</Box>;
    }
    if (count <= 2) {
        return (
            <Box>
                {forms?.map((form, index) => {
                    const formName =
                        index === count - 1 ? form.name : `${form.name}, `;
                    return (
                        <LinkToForm
                            key={form.id}
                            formId={form.id}
                            formName={formName}
                        />
                    );
                })}
            </Box>
        );
    }
    // If forms was undefined, count would be 0 and we would already have returned by now
    // @ts-ignore
    const formsString = `${forms[0].name}, ${forms[1].name}, ... (${count})`;
    const url = `/${baseUrls.forms}/search/ids:${forms?.map(form => form.id).join(',')}`;
    return (
        <Box className={classes.root}>
            <Link to={url}>{formsString}</Link>
        </Box>
    );
};
