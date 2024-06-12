import { useMemo } from 'react';
import { User, useCurrentUser } from '../../../../utils/usersUtils';
import { useGetDataSourceVersion } from '../../../dataSources/hooks/useGetDataSourceVersion';
import { useGetDataSource } from '../../../dataSources/hooks/useGetDataSources';
import { OrgUnitStatus } from '../../types/orgUnit';

export type SourceInfos = {
    sourceName?: string;
    sourceId?: number;
    versionNumber?: number;
    versionId?: number;
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
    const { data: source, isFetching: isFetchingSource } = useGetDataSource(
        sourceId ? `${sourceId}` : undefined,
    );
    const { data: version, isFetching: isFetchingVersion } =
        useGetDataSourceVersion(versionId ? `${versionId}` : undefined);
    return useMemo(() => {
        const defaultUserConfig =
            currentUser.account.default_version?.data_source
                ?.tree_config_status_fields;

        let sourceSettings = DEFAULT_CONFIG;
        let sourceInfos: SourceInfos | undefined;
        if (sourceId && source && !isFetchingSource) {
            if (source?.tree_config_status_fields?.length > 0) {
                sourceSettings = source.tree_config_status_fields;
            }
            sourceInfos = {
                sourceName: source.name,
                sourceId: source.id,
                versionNumber: source.default_version?.number,
                versionId: source.default_version?.id,
            };
        } else if (versionId && version && !isFetchingVersion) {
            if (version?.tree_config_status_fields?.length > 0) {
                sourceSettings = version.tree_config_status_fields;
            }
            sourceInfos = {
                sourceName: version.data_source_name,
                sourceId: version.data_source,
                versionNumber: version.number,
                versionId: version.id,
            };
        } else if (!sourceId && !versionId && defaultUserConfig) {
            if (defaultUserConfig?.length > 0) {
                sourceSettings = defaultUserConfig;
            }
            const defaultVersion = currentUser.account.default_version;
            sourceInfos = {
                sourceName: defaultVersion?.data_source?.name,
                sourceId: defaultVersion?.data_source?.id,
                versionNumber: defaultVersion?.number,
                versionId: defaultVersion?.id,
            };
        }
        return {
            sourceSettings,
            isFetchingSource,
            sourceInfos,
        };
    }, [
        currentUser.account.default_version,
        sourceId,
        source,
        isFetchingSource,
        versionId,
        version,
        isFetchingVersion,
    ]);
};
