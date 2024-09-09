import React, { FunctionComponent } from 'react';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { LinkToOrgUnit } from '../../orgUnits/components/LinkToOrgUnit';
import { LinkTo } from '../../../components/nav/LinkTo';
import { useCurrentUser } from '../../../utils/usersUtils';
import { userHasPermission } from '../utils';
import { PROJECTS, USER_ROLES } from '../../../utils/permissions';
import { baseUrls } from '../../../constants/urls';
import PERMISSIONS_MESSAGES from '../permissionsMessages';

type Props = {
    fieldKey: string;
    value?: string | number | boolean | Array<string> | Array<number>;
};

export const UserLogValue: FunctionComponent<Props> = ({ fieldKey, value }) => {
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
                return (
                    <>
                        {(value as Array<number>).map((orgUnitId, index) => {
                            return (
                                <LinkToOrgUnit
                                    key={orgUnitId}
                                    orgUnit={{
                                        name:
                                            index ===
                                            (value as Array<number>).length - 1
                                                ? `${orgUnitId}`
                                                : `${orgUnitId}, `,
                                        id: orgUnitId as number,
                                    }}
                                />
                            );
                        })}
                    </>
                );
            case 'user_roles':
                return (
                    <LinkTo
                        condition={userHasPermission(USER_ROLES, currentUser)}
                        url={`/${baseUrls.userRoles}`}
                        text={(value as Array<number>).toString()}
                    />
                );
            case 'projects':
                return (
                    <LinkTo
                        condition={userHasPermission(PROJECTS, currentUser)}
                        url={`/${baseUrls.projects}`}
                        text={(value as Array<number>).toString()}
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
            // case 'updated_at': {
            //     return moment(value).format('LTS');
            // }
            default:
                return value.toString();
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Could not parse', e);
        throw new Error(value.toString());
    }
};
