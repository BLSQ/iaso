import {
    formatLogContent,
    LogContentSource,
} from '../../compare/components/CompareInstanceLogs';
import { FormattedInstanceLog } from '../../compare/utils/formattedInstanceLog';
import { pickObjectEntriesByKeys } from './pickObjectEntriesByKeys';

const filterLogContentSource = (
    source: Partial<LogContentSource>,
    changedKeys: string[],
    filterPossibleFields: boolean,
): Partial<LogContentSource> => ({
    ...source,
    new_value: source.new_value?.map((entry, index) =>
        index === 0
            ? {
                  ...entry,
                  fields: {
                      ...entry.fields,
                      json: pickObjectEntriesByKeys(
                          changedKeys,
                          entry.fields.json ?? {},
                      ),
                  },
              }
            : entry,
    ),
    ...(filterPossibleFields && {
        possible_fields: (source.possible_fields ?? []).filter(field =>
            changedKeys.includes(field.name),
        ),
    }),
});

export const getChangedKeysFromDiff = (
    diff: { path: string }[] | undefined,
): string[] => (diff ?? []).map(({ path }) => path.split('/').at(-1) ?? '');

export const formatFilteredDiffContent = (
    previousResult: Partial<LogContentSource>,
    currentResult: Partial<LogContentSource>,
    changedKeys: string[],
): FormattedInstanceLog =>
    formatLogContent(
        filterLogContentSource(previousResult, changedKeys, true),
        filterLogContentSource(currentResult, changedKeys, true),
    );
