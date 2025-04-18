import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { User, useCurrentUser } from '../../../../utils/usersUtils';
import { useGetDataSource } from '../../../dataSources/hooks/useGetDataSource';
import { useGetDataSourceVersion } from '../../../dataSources/hooks/useGetDataSourceVersion';
import { Version } from '../../../dataSources/types/dataSources';
import { getVersionLabel } from '../../hooks/useGetVersionLabel';
import { OrgUnitStatus } from '../../types/orgUnit';
import { MESSAGES } from './messages';

export type SourceInfos = {
    sourceName?: string;
    sourceId?: number;
    versionNumber?: number;
    versionId?: number;
    versionLabel?: string;
};

type Config = {
    sourceSettings: OrgUnitStatus[];
    isFetchingSource: boolean;
    sourceInfos?: SourceInfos;
};

export const DEFAULT_CONFIG: OrgUnitStatus[] = ['VALID'];

export const useSourceConfig = (
    sourceId: number | string | undefined,
    versionId: number | string | undefined,
): Config => {
    const currentUser: User = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    const { data: source, isFetching: isFetchingSource } = useGetDataSource(
        sourceId && versionId === undefined ? `${sourceId}` : undefined,
    );
    const { data: version, isFetching: isFetchingVersion } =
        useGetDataSourceVersion(versionId ? `${versionId}` : undefined);
    return useMemo(() => {
        const defaultUserConfig =
            currentUser?.account?.default_version?.data_source
                ?.tree_config_status_fields;

        let sourceSettings = DEFAULT_CONFIG;
        let sourceInfos: SourceInfos | undefined;
        if (versionId) {
            if (version && !isFetchingVersion) {
                if (version?.tree_config_status_fields?.length > 0) {
                    sourceSettings = version.tree_config_status_fields;
                }
                sourceInfos = {
                    sourceName: version.data_source_name,
                    sourceId: version.data_source,
                    versionNumber: version.number,
                    versionId: version.id,
                    versionLabel: getVersionLabel(
                        version,
                        formatMessage(MESSAGES.default),
                    ),
                };
            }
        } else if (sourceId) {
            if (source && !isFetchingSource) {
                if (source?.tree_config_status_fields?.length > 0) {
                    sourceSettings = source.tree_config_status_fields;
                }
                sourceInfos = {
                    sourceName: source.name,
                    sourceId: source.id,
                    versionNumber: source.default_version?.number,
                    versionId: source.default_version?.id,
                    versionLabel: getVersionLabel(
                        {
                            ...source.default_version,
                            is_default: true,
                        },
                        formatMessage(MESSAGES.default),
                    ),
                };
            }
        } else if (!sourceId && !versionId && defaultUserConfig) {
            if (defaultUserConfig?.length > 0) {
                sourceSettings = defaultUserConfig;
            }
            const defaultVersion = currentUser.account.default_version;
            if (defaultVersion) {
                sourceInfos = {
                    sourceName: defaultVersion.data_source?.name,
                    sourceId: defaultVersion.data_source?.id,
                    versionNumber: defaultVersion.number,
                    versionId: defaultVersion.id,
                    versionLabel: getVersionLabel(
                        {
                            ...(defaultVersion as unknown as Version),
                            is_default: true,
                        },
                        formatMessage(MESSAGES.default),
                    ),
                };
            }
        }
        return {
            sourceSettings,
            isFetchingSource,
            sourceInfos,
        };
    }, [
        currentUser?.account.default_version,
        versionId,
        sourceId,
        isFetchingSource,
        version,
        isFetchingVersion,
        formatMessage,
        source,
    ]);
};
