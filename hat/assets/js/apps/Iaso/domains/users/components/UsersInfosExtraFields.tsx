import React, { FunctionComponent, useMemo } from 'react';
import { Box } from '@mui/material';
import { ColorPicker } from 'Iaso/components/forms/ColorPicker';
import { useGetProjectsDropdownOptions } from 'Iaso/domains/projects/hooks/requests';
import { User } from 'Iaso/utils/usersUtils';
import InputComponent from '../../../components/forms/InputComponent';
import MESSAGES from '../messages';
import { UserDialogData } from '../types';

type Props = {
    setFieldValue: (key: string, value: string) => void;
    currentUser: UserDialogData;
    loggedUser: User;
    canBypassProjectRestrictions: boolean;
};

export const UsersInfosExtraFields: FunctionComponent<Props> = ({
    setFieldValue,
    currentUser,
    loggedUser,
    canBypassProjectRestrictions,
}) => {
    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions(true, canBypassProjectRestrictions);
    const availableProjects = useMemo(() => {
        if (!loggedUser || !loggedUser.projects) {
            return [];
        }
        return allProjects?.map(project => {
            return {
                value: project.value,
                label: project.label,
                color: project.color,
            };
        });
    }, [allProjects, loggedUser]);
    return (
        <>
            <InputComponent
                keyValue="projects"
                onChange={(key: string, value) =>
                    setFieldValue(
                        key,
                        value
                            ?.split(',')
                            .map((projectId: string) =>
                                parseInt(projectId, 10),
                            ) ?? [],
                    )
                }
                value={currentUser.projects.value}
                errors={currentUser.projects.errors}
                type="select"
                multi
                label={MESSAGES.projects}
                options={availableProjects}
                loading={isFetchingProjects}
            />
            <Box sx={{ pt: 2, pb: 2 }}>
                <ColorPicker
                    currentColor={currentUser?.color?.value}
                    onChangeColor={(color: string): void =>
                        setFieldValue('color', color)
                    }
                />
            </Box>
        </>
    );
};
