import { makeStyles } from '@mui/styles';
import {
    IconButtonBuiltInIcon,
    IconButton,
    IntlMessage,
    LinkWithLocation,
    textPlaceholder,
    useKeyPressListener,
} from 'bluesquare-components';
import classNames from 'classnames';
import React, { FunctionComponent } from 'react';

import MESSAGES from './messages';
import { SvgIconComponent } from '@mui/icons-material';

export type IconVariant = IconButtonBuiltInIcon;

type Props = {
    condition: boolean;
    url: string;
    text?: string;
    useIcon?: boolean;
    className?: string;
    replace?: boolean;
    iconSize?: 'small' | 'medium' | 'large' | 'default' | 'inherit';
    size?: 'small' | 'medium' | 'large' | 'default' | 'inherit';
    tooltipMessage?: IntlMessage;
    color?: string;
    target?: '_blank' | '_self' | '_parent' | '_top';
    icon?: IconVariant;
    overrideIcon?: SvgIconComponent;
};

const useStyles = makeStyles(() => ({
    link: {
        cursor: 'pointer',
    },
}));
/**
 *
 * @description: A convenience component to conditionally display a link, usually by checking for permissions. Can easily be wrapped to create links to specific pages. See `LinkToOrgUnit`.
 *
 * @prop condition: boolean. The condition under which the link will be displayed and active. Usually a check on one or several permissions
 * @prop url: The destination url. Should start with a '/' as we use absolute paths
 * @prop text: Text to be displayed
 * @prop useIcon: Set to `true` to display an IconButton i.o. text
 * @prop replace: Set to `true` to replace current location in router history with destination when followingthe link. Defaults to `false`
 * @prop target: set to `"_blank"` to always open link in a new tab. Defaults to `"_self"`. Pressing ctrl/cmd + click will always open the link in a new tab
 * @prop tooltipMessage: an `IntlMessage` to be displayed by the IconButton tooltip. Doesn't have any effect if `useIcon` is false
 * @prop color: override default color
 * @prop size: Button size of the IconButton. Requires `useIcon` to be `true`
 * @prop iconSize: size of the Icon of the IconButton. Requires `useIcon` to be `true`
 * @prop className: a className for styling
 */

export const LinkTo: FunctionComponent<Props> = ({
    condition,
    url,
    text,
    useIcon = false,
    className = '',
    replace = false,
    iconSize = 'medium',
    size = 'medium',
    target = '_self',
    color,
    tooltipMessage = MESSAGES.see,
    icon = 'remove-red-eye',
    overrideIcon,
}) => {
    const targetBlankEnabled = useKeyPressListener('Meta');
    const actualTarget = targetBlankEnabled ? '_blank' : target;
    const classes: Record<string, string> = useStyles();
    if (condition) {
        if (useIcon) {
            return (
                <IconButton
                    icon={icon}
                    tooltipMessage={tooltipMessage}
                    iconSize={iconSize}
                    size={size}
                    reloadDocument={targetBlankEnabled}
                    url={url}
                    replace={replace}
                    color={color}
                    target={actualTarget}
                    overrideIcon={overrideIcon}
                />
            );
        }
        return (
            <LinkWithLocation
                className={classNames(className, classes.link)}
                reloadDocument={targetBlankEnabled}
                to={url}
                replace={replace}
                target={actualTarget}
            >
                {text || textPlaceholder}
            </LinkWithLocation>
        );
    }
    if (useIcon) return null;
    return <>{text || textPlaceholder}</>;
};
