import { makeStyles } from '@mui/styles';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { LinkTo } from '../../../components/nav/LinkTo';
import { baseUrls } from '../../../constants/urls';
import { NameAndId } from '../../../types/utils';
import { PROJECTS, USER_ROLES } from '../../../utils/permissions';
import { useCurrentUser } from '../../../utils/usersUtils';
import { LinkToOrgUnit } from '../../orgUnits/components/LinkToOrgUnit';
import MESSAGES from '../messages';
import PERMISSIONS_MESSAGES from '../permissionsMessages';
import { userHasPermission } from '../utils';

const useStyles = makeStyles({
    isDifferent: {
        color: 'white !important',
    },
});

type Props = {
    fieldKey: string;
    value?:
        | string
        | number
        | boolean
        | Array<string>
        | Array<number>
        | Array<NameAndId>;
    isDifferent: boolean;
};

export const UserLogValue: FunctionComponent<Props> = ({
    fieldKey,
    value,
    isDifferent,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();

    if (
        (fieldKey !== 'password_updated' && !value) ||
        value === '' ||
        value === null ||
        value === undefined
    )
        return textPlaceholder;
    try {
        switch (fieldKey) {
            case 'password_updated':
                return value
                    ? formatMessage(MESSAGES.yes)
                    : formatMessage(MESSAGES.no);
            case 'language':
                return MESSAGES[value as string]
                    ? formatMessage(MESSAGES[value as string])
                    : value;
            case 'org_units':
                if (!value || (value as Array<NameAndId>).length === 0) {
                    return textPlaceholder;
                }
                return (
                    <>
                        {(value as Array<NameAndId>).map((orgUnit, index) => {
                            return (
                                <LinkToOrgUnit
                                    key={orgUnit.id}
                                    className={
                                        isDifferent
                                            ? classes.isDifferent
                                            : undefined
                                    }
                                    orgUnit={{
                                        name:
                                            index ===
                                            (value as Array<NameAndId>).length -
                                                1
                                                ? `${orgUnit.name}`
                                                : `${orgUnit.name}, `,
                                        id: orgUnit.id,
                                    }}
                                />
                            );
                        })}
                    </>
                );
            case 'user_roles':
                return (
                    <LinkTo
                        className={
                            isDifferent ? classes.isDifferent : undefined
                        }
                        condition={userHasPermission(USER_ROLES, currentUser)}
                        url={`/${baseUrls.userRoles}`}
                        text={(value as Array<NameAndId>)
                            .map(userRole => userRole.name)
                            .toString()}
                    />
                );
            case 'projects':
                return (
                    <LinkTo
                        className={
                            isDifferent ? classes.isDifferent : undefined
                        }
                        condition={userHasPermission(PROJECTS, currentUser)}
                        url={`/${baseUrls.projects}`}
                        text={(value as Array<NameAndId>)
                            .map(project => project.name)
                            .toString()}
                    />
                );
            case 'user_permissions':
                return (
                    <ul>
                        {(value as Array<string>).map(permCode => (
                            <li key={permCode}>
                                {PERMISSIONS_MESSAGES[permCode]
                                    ? formatMessage(
                                          PERMISSIONS_MESSAGES[permCode],
                                      )
                                    : permCode}
                            </li>
                        ))}
                    </ul>
                );
            default:
                return value.toString();
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Could not parse', e);
        throw new Error(value.toString());
    }
};
