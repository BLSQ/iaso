/* eslint-disable camelcase */
import { Profile } from '../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';

export const findApprovaTeams = (teams: any[]): number[] => {
    return teams
        .filter(team => team.name.toLowerCase().includes('approval'))
        .map(team => team.id);
};

export const formatUserName = (profile: Profile): string => {
    return profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile?.user_name ?? profile?.user_id;
};

export const formatTargetTeams = (targetTeams: number[], teams): string => {
    return targetTeams?.length === 0
        ? // TODO translate or throw error
          'None'
        : targetTeams
              .map(
                  (target_team: number) =>
                      teams?.find(team => team.id === target_team)?.name,
              )
              .join(', ');
};
