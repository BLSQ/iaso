import { useMemo } from 'react';
import { DefaultVersion } from 'Iaso/utils/usersUtils';
import { Search } from '../../types/search';

/**
 * Returns the source version ids for the given searches and default version
 * @param searches - The searches to get the source version ids for
 * @param defaultVersion - The default version to use if no version is provided in the searches
 * @returns The source version ids
 */
export const useSourceVersionIds = (
    searches: Search[],
    defaultVersion?: DefaultVersion,
): string | undefined => {
    return useMemo(() => {
        let versions: number[] = [];
        const searchesWithVersion = searches.filter(s => s.version);
        if (searchesWithVersion.length > 0) {
            versions = searchesWithVersion.flatMap(s =>
                parseInt(s.version!, 10),
            );
        } else {
            versions = defaultVersion?.id ? [defaultVersion?.id] : [];
        }
        return versions.length > 0 ? versions.join(',') : undefined;
    }, [defaultVersion, searches]);
};
