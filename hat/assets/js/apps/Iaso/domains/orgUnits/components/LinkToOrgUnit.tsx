import React, { FunctionComponent } from 'react';
import { makeStyles } from '@material-ui/core';
import {
    // @ts-ignore
    IconButton as IconButtonComponent,
} from 'bluesquare-components';

import { Link } from 'react-router';
import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';
import { OrgUnit, ShortOrgUnit } from '../types/orgUnit';

import MESSAGES from '../../assignments/messages';

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
    orgUnit: OrgUnit | ShortOrgUnit | undefined;
    useIcon?: boolean;
};

export const LinkToOrgUnit: FunctionComponent<Props> = ({
    orgUnit,
    useIcon,
}) => {
    const user = useCurrentUser();
    const classes: Record<string, string> = useStyles();
    if (userHasPermission('iaso_org_units', user) && orgUnit) {
        const url = `/${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit.id}`;
        if (useIcon) {
            return (
                <IconButtonComponent
                    url={url}
                    icon="remove-red-eye"
                    tooltipMessage={MESSAGES.details}
                />
            );
        }
        return (
            <Link className={classes.root} to={url}>
                {orgUnit.name}
            </Link>
        );
    }
    return <>{orgUnit ? orgUnit.name : '-'}</>;
};

LinkToOrgUnit.defaultProps = {
    useIcon: false,
};
