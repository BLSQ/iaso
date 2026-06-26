import React, {
    Dispatch,
    FunctionComponent,
    createContext,
    useContext,
    useMemo,
    useState,
} from 'react';
import { useSaveTeam } from 'Iaso/domains/teams/hooks/requests/useSaveTeam';
import { SubTeam, User } from 'Iaso/domains/teams/types/team';
import { useSaveProfile } from 'Iaso/domains/users/hooks/useSaveProfile';
import { useSaveAssignment } from '../hooks/requests/useSaveAssignment';
import { AssignmentsResult } from '../types/assigment';

type AssignmentsContextValue = {
    planningId: string;
    assignments?: AssignmentsResult;
    selectedUser?: User;
    setSelectedUser: Dispatch<React.SetStateAction<User | undefined>>;
    selectedTeam?: SubTeam;
    setSelectedTeam: Dispatch<React.SetStateAction<SubTeam | undefined>>;
    canAssign: boolean;
    handleSaveAssignment: (orgUnitId: number) => void;
    isSaving: boolean;
    updateTeam: (team: Partial<SubTeam>) => void;
    updateUser: (user: Partial<User>) => void;
};

const AssignmentsContext = createContext<AssignmentsContextValue | undefined>(
    undefined,
);

export const useAssignmentsContext = (): AssignmentsContextValue => {
    const context = useContext(AssignmentsContext);
    if (!context) {
        throw new Error(
            'useAssignmentsContext must be used within an AssignmentsProvider',
        );
    }
    return context;
};

type AssignmentsProviderProps = {
    planningId: string;
    assignments?: AssignmentsResult;
    initialSelectedUser?: User;
    initialSelectedTeam?: SubTeam;
    children: React.ReactNode;
};

export const AssignmentsProvider: FunctionComponent<
    AssignmentsProviderProps
> = ({
    planningId,
    assignments,
    initialSelectedUser,
    initialSelectedTeam,
    children,
}) => {
    const [selectedUser, setSelectedUser] = useState<User | undefined>(
        initialSelectedUser,
    );
    const [selectedTeam, setSelectedTeam] = useState<SubTeam | undefined>(
        initialSelectedTeam,
    );

    const { mutate: updateTeam } = useSaveTeam('edit', false);
    const { mutate: updateUser } = useSaveProfile({
        showSuccessSnackBar: false,
        extraInvalidateQueryKeys: ['planningChildrenOrgUnitsPaginated'],
    });

    const { handleSaveAssignment, isLoading: isSaving } = useSaveAssignment({
        planningId,
        assignments,
        selectedUser,
        selectedTeam,
    });

    const canAssign = Boolean(selectedUser || selectedTeam);

    const contextValue = useMemo(
        () => ({
            planningId,
            assignments,
            selectedUser,
            setSelectedUser,
            selectedTeam,
            setSelectedTeam,
            canAssign,
            handleSaveAssignment,
            isSaving,
            updateTeam,
            updateUser,
        }),
        [
            planningId,
            assignments,
            selectedUser,
            selectedTeam,
            canAssign,
            handleSaveAssignment,
            isSaving,
            updateTeam,
            updateUser,
        ],
    );

    return (
        <AssignmentsContext.Provider value={contextValue}>
            {children}
        </AssignmentsContext.Provider>
    );
};
