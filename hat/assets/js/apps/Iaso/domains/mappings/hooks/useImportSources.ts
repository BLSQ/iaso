import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell';
import {
    countMatchingMappings,
    getImportableMappings,
} from '../importMappings';
import MESSAGES from '../messages';
import { ImportSource, MappingVersionRow } from '../types';
import { useGetMappingImportSources } from './requests/useGetMappingImportSources';

const sortByVersionDesc = (a: MappingVersionRow, b: MappingVersionRow) =>
    `${b.form_version.version_id}`.localeCompare(
        `${a.form_version.version_id}`,
    );

/**
 * Other versions of the same form, with the same mapping type and data
 * source, the wizard can import from. Mappings of another form go through an
 * export / import of the JSON file.
 */
export const useImportSources = (
    mappingVersion: MappingVersionRow,
    questions: Record<string, any>,
    enabled: boolean,
): { sources: ImportSource[]; isLoading: boolean } => {
    const { formatMessage } = useSafeIntl();
    const { data, isLoading } = useGetMappingImportSources(
        mappingVersion.form_version.form.id,
        mappingVersion.mapping.mapping_type,
        enabled,
    );
    const sources = useMemo(() => {
        const dataSourceId = mappingVersion.mapping.data_source.id;
        return (data ?? [])
            .filter(
                candidate =>
                    candidate.id !== mappingVersion.id &&
                    candidate.mapping.data_source.id === dataSourceId,
            )
            .sort(sortByVersionDesc)
            .map(candidate => {
                const questionMappings = getImportableMappings(
                    candidate.question_mappings,
                );
                return {
                    id: `${candidate.id}`,
                    title: formatMessage(MESSAGES.importVersionTitle, {
                        versionId: candidate.form_version.version_id,
                    }),
                    meta: formatMessage(MESSAGES.importVersionMeta, {
                        date: DateTimeCell({ value: candidate.updated_at }),
                    }),
                    mappingsCount: Object.keys(questionMappings).length,
                    matchingCount: countMatchingMappings(
                        questionMappings,
                        questions,
                        mappingVersion.mapping.mapping_type,
                    ),
                    questionMappings,
                };
            });
    }, [data, mappingVersion, questions, formatMessage]);
    return { sources, isLoading };
};
