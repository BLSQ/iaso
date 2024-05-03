import React, { FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles } from '@mui/styles';
import {
    IconButton as IconButtonComponent,
    useKeyPressListener,
} from 'bluesquare-components';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { Link } from 'react-router-dom';
import classNames from 'classnames';

import { userHasPermission } from '../../users/utils';
import { baseUrls } from '../../../constants/urls';
import { useCurrentUser } from '../../../utils/usersUtils';
import { OrgUnit, ShortOrgUnit } from '../../orgUnits/types/orgUnit';
import { redirectTo, redirectToReplace } from '../../../routing/actions';

import MESSAGES from '../messages';

import * as Permission from '../../../utils/permissions';

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

export const LinkToRegistry: FunctionComponent<Props> = ({
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
    if (userHasPermission(Permission.REGISTRY, user) && orgUnit) {
        const url = `/${baseUrls.registryDetail}/orgUnitId/${orgUnit?.id}`;
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
                    overrideIcon={MenuBookIcon}
                    tooltipMessage={MESSAGES.seeRegistry}
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
