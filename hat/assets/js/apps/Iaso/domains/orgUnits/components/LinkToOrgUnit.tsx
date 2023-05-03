import React, { FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/core';
import classNames from 'classnames';
import {
    IconButton as IconButtonComponent,
    useKeyPressListener,
} from 'bluesquare-components';

import { Link } from 'react-router';
import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';
import { OrgUnit, ShortOrgUnit } from '../types/orgUnit';

import { redirectTo, redirectToReplace } from '../../../routing/actions';

import MESSAGES from '../../assignments/messages';

type Props = {
    orgUnit?: OrgUnit | ShortOrgUnit;
    useIcon?: boolean;
    className?: string;
    replace?: boolean;
    iconSize?: 'small' | 'medium' | 'large' | 'default' | 'inherit';
    size?: 'small' | 'medium' | 'large' | 'default' | 'inherit';
};

const useStyles = makeStyles(() => ({
    link: {
        cursor: 'pointer',
    },
}));

export const LinkToOrgUnit: FunctionComponent<Props> = ({
    orgUnit,
    useIcon = false,
    className = '',
    replace = false,
    iconSize = 'medium',
    size = 'medium',
}) => {
    const user = useCurrentUser();
    const targetBlankEnabled = useKeyPressListener('Meta');
    const classes: Record<string, string> = useStyles();
    const dispatch = useDispatch();
    if (userHasPermission('iaso_org_units', user) && orgUnit) {
        const url = `/${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit.id}`;
        const handleClick = () => {
            if (targetBlankEnabled) {
                window.open(`/dashboard${url}`, '_blank');
            } else if (replace) {
                dispatch(redirectToReplace(url));
            } else {
                dispatch(redirectTo(url));
            }
        };
        if (useIcon) {
            return (
                <IconButtonComponent
                    onClick={handleClick}
                    icon="remove-red-eye"
                    tooltipMessage={MESSAGES.details}
                    iconSize={iconSize}
                    size={size}
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
    if (useIcon) return null;
    return <>{orgUnit ? orgUnit.name : '-'}</>;
};
