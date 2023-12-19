/* eslint-disable camelcase */
import { Typography } from '@mui/material';
import React from 'react';
import { Link } from 'react-router';
import { Profile } from '../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { fileExtensions } from '../../constants/fileExtensions';
import {
    Nullable,
    Optional,
} from '../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { Team } from '../../../../../../hat/assets/js/apps/Iaso/domains/teams/types/team';
import { FileWithName, LinkWithAlias } from './types';

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

const truncateFileName = (fileName: string) => {
    if (fileName.length <= 30) return fileName;
    const separator = '...';
    const end = fileName.substring(fileName.length - 5, fileName.length);
    const start = fileName.substring(0, 22);
    return `${start}${separator}${end}`;
};

export const makeFileLinks = (files: FileWithName[]): React.ReactNode => {
    return files.map((file, index) => {
        return (
            // eslint-disable-next-line react/no-array-index-key
            <Link key={`${file.filename}_${index}`} download href={file.file}>
                {/* @ts-ignore */}
                <Typography variant="body2" style={{ wordWrap: 'anywhere' }}>
                    {truncateFileName(file.filename)}
                </Typography>
            </Link>
        );
    });
};

export const makeLinks = (
    links: Optional<Nullable<LinkWithAlias[]>>,
): Nullable<any[]> => {
    if (!links) return null;
    return links.map((link, index) => {
        return (
            // eslint-disable-next-line react/no-array-index-key
            <Link key={`${link.alias}_${index}`} download href={link.url}>
                {/* @ts-ignore */}
                <Typography variant="body2" style={{ wordWrap: 'anywhere' }}>
                    {link.alias}
                </Typography>
            </Link>
        );
    });
};
