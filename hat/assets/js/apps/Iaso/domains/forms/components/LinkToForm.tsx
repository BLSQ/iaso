import React, { FunctionComponent } from 'react';

import { makeStyles, Theme } from '@material-ui/core';
import { Link } from 'react-router';
import { useSelector } from 'react-redux';
import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';

type Users = {
    current: any;
};
type State = {
    users: Users;
};
type Props = {
    formId: string;
    formName: unknown;
};
const useStyles = makeStyles((theme: Theme) => ({
    link: {
        color: theme.palette.primary.main,
        textDecoration: 'none',
        '&:hover': {
            textDecoration: 'underline',
        },
    },
}));

export const LinkToForm: FunctionComponent<Props> = ({ formId, formName }) => {
    const classes: any = useStyles();
    const user: any = useSelector((state: State) => state.users.current);
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
