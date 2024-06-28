import { useSafeIntl } from 'bluesquare-components';
import { useCallback } from 'react';
import { DropdownOptionsWithOriginal } from '../../../types/utils';
import MESSAGES from '../messages';
import { DataSource } from '../types/dataSources';

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
                    return `${version.number}${
                        version.description ? ` - ${version.description}` : ''
                    }${isDefault ? ` (${formatMessage(MESSAGES.default)})` : ''}`;
                }
            }
            return '';
        },
        [dataSources, formatMessage],
    );
};
