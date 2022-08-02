import { useState, useEffect } from 'react';
import { useGetApprovalTeams } from '../../../hooks/useGetTeams';

export const useIsUserInApprovalTeam = (userId?: number): boolean => {
    const { data: approvalTeams, isFetching } = useGetApprovalTeams();
    const [isUserInApprovalTeam, setIsUserInApprovalTeam] =
        useState<boolean>(false);

    useEffect(() => {
        if (userId && !isFetching)
            setIsUserInApprovalTeam(
                Boolean(
                    approvalTeams.find(team => team.users.includes(userId)),
                ),
            );
    }, [approvalTeams, isFetching, userId]);

    return isUserInApprovalTeam;
};
