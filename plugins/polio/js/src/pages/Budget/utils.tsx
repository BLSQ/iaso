/* eslint-disable camelcase */
import { Typography } from '@material-ui/core';
import React from 'react';
import { Link } from 'react-router';
import { Profile } from '../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { fileExtensions } from '../../constants/fileExtensions';
import {
    Nullable,
    Optional,
} from '../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { Team } from '../../../../../../hat/assets/js/apps/Iaso/domains/teams/types/team';

export const findApprovalTeams = (teams: any[]): number[] => {
    return teams
        .filter(team => team.name.toLowerCase().includes('approval'))
        .map(team => team.id);
};

export const formatUserName = (profile: Profile): string => {
    return profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile?.user_name ?? profile?.user_id;
};

export const formatTargetTeams = (
    targetTeams: number[],
    teams: Team[],
): string => {
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

export const extractFileName = (fileUrl: string): string => {
    let trimmedLeft = '';
    let i = 0;
    // find the end of file name by searching for the extension
    while (trimmedLeft === '' && i < fileExtensions.length) {
        const currentExtension = fileExtensions[i];
        if (fileUrl?.indexOf(currentExtension) !== -1) {
            trimmedLeft = `${
                fileUrl?.split(currentExtension)[0]
            }${currentExtension}`;
        }
        i += 1;
    }
    // The name is the behind the last slash, so we find it by splitting
    const removedSlashes = trimmedLeft.split('/');
    return removedSlashes[removedSlashes.length - 1];
};

export const makeFileLinks = (files: string[]): React.ReactNode => {
    return files.map((file, index) => {
        const fileName = extractFileName(file) || file;
        return (
            // eslint-disable-next-line react/no-array-index-key
            <Link key={`${fileName}_${index}`} download href={file}>
                {/* @ts-ignore */}
                <Typography style={{ wordWrap: 'anywhere' }}>
                    {fileName}
                </Typography>
            </Link>
        );
    });
};

export const makeLinks = (
    links: Optional<Nullable<string[]>>,
): Nullable<any[]> => {
    if (!links) return null;
    // const linksArray = links.split(',');
    return links.map((link, index) => {
        const trimmedLink = link.trim();
        return (
            // eslint-disable-next-line react/no-array-index-key
            <Link key={`${trimmedLink}_${index}`} download href={trimmedLink}>
                {/* @ts-ignore */}
                <Typography style={{ wordWrap: 'anywhere' }}>
                    {trimmedLink}
                </Typography>
            </Link>
        );
    });
};
