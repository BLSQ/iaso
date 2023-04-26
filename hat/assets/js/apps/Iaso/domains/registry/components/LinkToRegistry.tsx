import React, { FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/core';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import { Link } from 'react-router';
import classNames from 'classnames';

import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';
import { OrgUnit, ShortOrgUnit } from '../../orgUnits/types/orgUnit';
import { redirectTo, redirectToReplace } from '../../../routing/actions';

import MESSAGES from '../messages';

type Props = {
    orgUnit?: OrgUnit | ShortOrgUnit;
    useIcon?: boolean;
    className?: string;
    replace?: boolean;
};

const useStyles = makeStyles(() => ({
    link: {
        cursor: 'pointer',
    },
}));
export const LinkToRegistry: FunctionComponent<Props> = ({
    orgUnit,
    useIcon = false,
    className = '',
    replace = false,
}) => {
    const user = useCurrentUser();
    const classes: Record<string, string> = useStyles();
    const dispatch = useDispatch();
    if (userHasPermission('iaso_registry', user) && orgUnit) {
        const url = `/${baseUrls.registryDetail}/orgUnitId/${orgUnit?.id}`;
        const handleClick = () => {
            if (replace) {
                dispatch(redirectToReplace(url));
            } else {
                dispatch(redirectTo(url));
            }
        };
        if (useIcon) {
            return (
                <IconButtonComponent
                    onClick={handleClick}
                    overrideIcon={MenuBookIcon}
                    tooltipMessage={MESSAGES.seeRegistry}
                />
            );
        }
        return (
            <Link
                className={classNames(className, classes.link)}
                onClick={handleClick}
            >
                {orgUnit.name}
            </Link>
        );
    }
    return <>{orgUnit ? orgUnit.name : '-'}</>;
};
