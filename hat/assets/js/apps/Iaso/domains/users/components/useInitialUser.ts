import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import get from 'lodash/get';
import { emailRegex } from '../../../libs/utils';
import { useGetUserRolesDropDown } from '../../userRoles/hooks/requests/useGetUserRoles';
import { UserRole } from '../../userRoles/types/userRoles';
import MESSAGES from '../messages';
import { InitialUserData, UserDialogData } from '../types';

export type InitialUserUtils = {
    user: UserDialogData;
    setFieldErrors: (fieldName, fieldError) => void;
    setFieldValue: (fieldName, fieldError) => void;
    setPhoneNumber: (phoneNumber: string, countryCode: string) => void;
    setEmail: (email: string) => void;
    hasErrors: boolean;
};

export const useInitialUser = (
    initialData: InitialUserData,
): InitialUserUtils => {
    const { formatMessage } = useSafeIntl();
    const initialUser: UserDialogData = useMemo(() => {
        return {
            id: { value: get(initialData, 'id', null), errors: [] },
            userName: {
                value: get(initialData, 'userName', ''),
                errors: [],
            },
            firstName: {
                value: get(initialData, 'firstName', ''),
                errors: [],
            },
            lastName: {
                value: get(initialData, 'lastName', ''),
                errors: [],
            },
            email: { value: get(initialData, 'email', ''), errors: [] },
            password: { value: '', errors: [] },
            permissions: {
                value: get(initialData, 'permissions', []),
                errors: [],
            },
            orgUnits: {
                value: get(initialData, 'orgUnits', []),
                errors: [],
            },
            language: {
                value: get(initialData, 'language', ''),
                errors: [],
            },
            homePage: {
                value: get(initialData, 'homePage', ''),
                errors: [],
            },
            organization: {
                value: get(initialData, 'organization', undefined),
                errors: [],
            },
            dhis2Id: {
                value: get(initialData, 'dhis2Id', ''),
                errors: [],
            },
            userRoles: {
                value: get(initialData, 'userRoles', []),
                errors: [],
            },
            userRolesPermissions: {
                value: get(initialData, 'userRolesPermissions', []),
                errors: [],
            },
            userPermissions: {
                value: get(initialData, 'userPermissions', []),
                errors: [],
            },
            sendEmailInvitation: {
                value: get(initialData, 'sendEmailInvitation', false),
                errors: [],
            },
            projects: {
                value: get(initialData, 'projects', []).map(
                    project => project.id,
                ),
                errors: [],
            },
            phoneNumber: {
                value: get(initialData, 'phoneNumber', ''),
                errors: [],
            },
            countryCode: {
                value: get(initialData, 'countryCode', ''),
                errors: [],
            },
            editableOrgUnitTypeIds: {
                value: get(initialData, 'editableOrgUnitTypeIds', []),
                errors: [],
            },
            userRolesEditableOrgUnitTypeIds: {
                value: get(initialData, 'userRolesEditableOrgUnitTypeIds', []),
                errors: [],
            },
            hasMultipleAccounts: {
                value: get(initialData, 'otherAccounts', [])?.length > 0,
                errors: [],
            },
            color: {
                value: get(initialData, 'color', ''),
                errors: [],
            },
        };
    }, [initialData]);
    const [user, setUser] = useState<UserDialogData>(initialUser);

    const { data: userRoles } = useGetUserRolesDropDown();
    const setFieldErrors = useCallback(
        (fieldName, fieldError) => {
            setUser({
                ...user,
                [fieldName]: {
                    value: user[fieldName].value,
                    errors: [fieldError],
                },
            });
        },
        [user],
    );
    const setFieldValue = useCallback(
        (fieldName, fieldValue) => {
            const newUser = {
                ...user,
            };
            newUser[fieldName] = {
                value: fieldValue,
                errors: [],
            };
            if (fieldName === 'sendEmailInvitation' && fieldValue) {
                newUser.password = {
                    value: null,
                    errors: [],
                };
            }
            if (fieldName === 'userRoles') {
                let userRolesEditableOrgUnitTypeIds: any = [];
                const userRolesPermissions: UserRole[] = (userRoles || [])
                    .filter(userRole => fieldValue.includes(userRole.value))
                    .map(userRole => {
                        userRolesEditableOrgUnitTypeIds = [
                            ...new Set([
                                ...userRolesEditableOrgUnitTypeIds,
                                ...(userRole.original?.editableOrgUnitTypeIds ??
                                    []),
                            ]),
                        ];
                        const role = {
                            ...(userRole.original as UserRole),
                            permissions: userRole.original?.permissions,
                        };
                        return role;
                    });
                newUser.userRolesPermissions = {
                    value: userRolesPermissions,
                    errors: [],
                };
                newUser.userRolesEditableOrgUnitTypeIds = {
                    value: userRolesEditableOrgUnitTypeIds,
                    errors: [],
                };
            }

            setUser(newUser);
        },
        [user, userRoles],
    );

    const setPhoneNumber = useCallback(
        (phoneNumber, countryCode) => {
            setUser({
                ...user,
                phoneNumber: { value: phoneNumber, errors: [] },
                countryCode: { value: countryCode, errors: [] },
            });
        },
        [user],
    );
    const setEmail = useCallback(
        email => {
            setUser({
                ...user,
                email: {
                    value: email === '' ? undefined : email,
                    errors:
                        emailRegex.test(email) || email === ''
                            ? []
                            : [formatMessage(MESSAGES.invalidEmailFormat)],
                },
            });
        },
        [user, formatMessage],
    );
    const hasErrors = useMemo(() => {
        return Object.values(user).some(field => field.errors.length > 0);
    }, [user]);

    useEffect(() => {
        setUser(initialUser);
    }, [initialUser]);

    return useMemo(() => {
        return {
            user,
            setFieldValue,
            setFieldErrors,
            setPhoneNumber,
            setEmail,
            hasErrors,
        };
    }, [
        setFieldErrors,
        setFieldValue,
        user,
        setPhoneNumber,
        setEmail,
        hasErrors,
    ]);
};
