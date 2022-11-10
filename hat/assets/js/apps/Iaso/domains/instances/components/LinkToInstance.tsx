import React, { FunctionComponent } from 'react';

import { Link } from 'react-router';
// @ts-ignore
import { makeStyles } from '@material-ui/core';
import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';

const useStyles = makeStyles(theme => ({
    root: {
        textDecoration: 'none',
        color: theme.palette.primary.main,
        '&:hover': {
            textDecoration: 'underline',
        },
    },
}));

type Props = {
    instanceId: string;
};
export const LinkToInstance: FunctionComponent<Props> = ({ instanceId }) => {
    const user = useCurrentUser();
    const classes: Record<string, string> = useStyles();
    if (userHasPermission('iaso_submissions', user)) {
        const formUrl = `/${baseUrls.instanceDetail}/instanceId/${instanceId}`;
        return (
            <Link className={classes.root} to={formUrl}>
                {instanceId}
            </Link>
        );
    }
    return <>{instanceId}</>;
};
