import { useSafeIntl } from 'bluesquare-components';
import { useCallback } from 'react';
import { DropdownOptionsWithOriginal } from '../../../types/utils';
import { Version } from '../../dataSources/types/dataSources';
import MESSAGES from '../messages';
import { DataSource } from '../types/dataSources';

export const getVersionLabel = (version: Version, defaultMessage: string) => {
    return `${version.number}${
        version.description ? ` - ${version.description}` : ''
    }${version.is_default ? ` (${defaultMessage})` : ''}`;
};

export const useGetVersionLabel = (
    dataSources?: DropdownOptionsWithOriginal<DataSource>[],
) => {
    const { formatMessage } = useSafeIntl();
    return useCallback(
        (versionId: number | string): string => {
            const versionIdNumber = parseInt(versionId as string, 10);
            const dataSource = dataSources?.find(ds =>
                ds.original.versions.some(v => v.id === versionIdNumber),
            );
            if (dataSource) {
                const version = dataSource.original.versions.find(
                    v => v.id === versionIdNumber,
                );
                if (version) {
                    const isDefault =
                        dataSource.original.default_version?.id ===
                        versionIdNumber;
                    return getVersionLabel(
                        { ...version, is_default: isDefault },
                        formatMessage(MESSAGES.default),
                    );
                }
            }
            return '';
        },
        [dataSources, formatMessage],
    );
};
