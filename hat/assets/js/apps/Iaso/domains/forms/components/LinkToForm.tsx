import React, { FunctionComponent } from 'react';

import { Link } from 'react-router';
import { makeStyles } from '@material-ui/core';
import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';

type Props = {
    formId: string | number;
    formName: unknown;
};

const useStyles = makeStyles(theme => ({
    link: {
        color: theme.palette.primary.main,
        textDecoration: 'none',
        '&:hover': { textDecoration: 'underline' },
    },
}));
export const LinkToForm: FunctionComponent<Props> = ({ formId, formName }) => {
    const classes: Record<string, string> = useStyles();
    const user = useCurrentUser();
    if (userHasPermission('iaso_forms', user)) {
        const formUrl = `/${baseUrls.formDetail}/formId/${formId}`;
        return (
            <Link className={classes.link} to={formUrl}>
                {formName}
            </Link>
        );
    }
    return <>{formName}</>;
};
