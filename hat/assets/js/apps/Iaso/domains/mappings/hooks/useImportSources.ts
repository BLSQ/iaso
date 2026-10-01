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

const isSameTarget = (
    candidate: MappingVersionRow,
    mappingVersion: MappingVersionRow,
): boolean => {
    const settings = mappingVersion.derivate_settings ?? {};
    const candidateSettings = candidate.derivate_settings ?? {};
    if (settings.data_set_id) {
        return candidateSettings.data_set_id === settings.data_set_id;
    }
    return (
        Boolean(settings.program_id) &&
        candidateSettings.program_id === settings.program_id
    );
};

/**
 * Other mapping versions of the same type and data source the wizard can
 * import from: first the versions of the same form, then the other forms
 * mapped to the same DHIS2 dataset or program.
 */
export const useImportSources = (
    mappingVersion: MappingVersionRow,
    questions: Record<string, any>,
    enabled: boolean,
): { sources: ImportSource[]; isLoading: boolean } => {
    const { formatMessage } = useSafeIntl();
    const { data, isLoading } = useGetMappingImportSources(
        mappingVersion.mapping.mapping_type,
        enabled,
    );
    const sources = useMemo(() => {
        const formId = mappingVersion.form_version.form.id;
        const dataSourceId = mappingVersion.mapping.data_source.id;
        const candidates = (data ?? []).filter(
            candidate =>
                candidate.id !== mappingVersion.id &&
                candidate.mapping.data_source.id === dataSourceId,
        );
        const toImportSource = (
            candidate: MappingVersionRow,
            sameForm: boolean,
        ): ImportSource => {
            const questionMappings = getImportableMappings(
                candidate.question_mappings,
            );
            const date = DateTimeCell({ value: candidate.updated_at });
            const otherFormMeta = candidate.derivate_settings?.program_id
                ? MESSAGES.importOtherFormProgramMeta
                : MESSAGES.importOtherFormDatasetMeta;
            return {
                id: `${candidate.id}`,
                title: sameForm
                    ? formatMessage(MESSAGES.importVersionTitle, {
                          versionId: candidate.form_version.version_id,
                      })
                    : formatMessage(MESSAGES.importOtherFormTitle, {
                          formName: candidate.form_version.form.name,
                          versionId: candidate.form_version.version_id,
                      }),
                meta: formatMessage(
                    sameForm ? MESSAGES.importSameFormMeta : otherFormMeta,
                    { date },
                ),
                mappingsCount: Object.keys(questionMappings).length,
                matchingCount: countMatchingMappings(
                    questionMappings,
                    questions,
                    mappingVersion.mapping.mapping_type,
                ),
                questionMappings,
            };
        };
        const sameFormSources = candidates
            .filter(c => c.form_version.form.id === formId)
            .sort(sortByVersionDesc)
            .map(c => toImportSource(c, true));
        const otherFormSources = candidates
            .filter(
                c =>
                    c.form_version.form.id !== formId &&
                    isSameTarget(c, mappingVersion),
            )
            .sort(sortByVersionDesc)
            .map(c => toImportSource(c, false));
        return [...sameFormSources, ...otherFormSources];
    }, [data, mappingVersion, questions, formatMessage]);
    return { sources, isLoading };
};
