import { JsonLogicTree } from '@react-awesome-query-builder/mui';
import { z as zod } from 'zod';
import {
    ScenarioOutcome,
    ScenarioOutcomeOutput,
    StepResultOutput,
} from 'Iaso/api/scenarios';

const readText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });

/** A scenario file's content, or null when it isn't JSON. */
export const parseScenarioFile = async (
    file: File,
): Promise<Record<string, unknown> | null> => {
    try {
        return JSON.parse(await readText(file));
    } catch {
        return null;
    }
};

export const downloadJson = (fileName: string, content: unknown): void => {
    const blob = new Blob([JSON.stringify(content, null, 2)], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
};

/** `scenario-<name>.json`, as in the examples. */
export const scenarioFileName = (name: string): string =>
    `scenario-${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.json`;

/** The last run kept on a scenario (a JSON field), when it has the shape of a run result. */
export const parseLastRun = (
    lastRunResult: unknown,
): ScenarioOutcomeOutput | null => {
    const parsed = ScenarioOutcome.safeParse(lastRunResult);
    return parsed.success ? parsed.data : null;
};

// what the pages read from a scenario file (`definition`): validated, not trusted
const ScenarioFile = zod.object({
    form: zod.string().optional(),
    steps: zod
        .array(
            zod.object({
                form: zod.string().optional(),
                description: zod.string().optional(),
                at: zod.string().nullish(),
                expect: zod
                    .object({
                        next_forms: zod.array(zod.string()).nullish(),
                        attributes: zod
                            .record(zod.string(), zod.unknown())
                            .optional(),
                        submission: zod
                            .record(zod.string(), zod.unknown())
                            .optional(),
                        refused: zod
                            .array(
                                zod.object({
                                    question: zod.string(),
                                    code: zod.string().nullish(),
                                }),
                            )
                            .nullish(),
                    })
                    .nullish(),
            }),
        )
        .default([]),
});

export type FormDescriptions = ScenarioOutcomeOutput['forms'];

export type StepChecks = NonNullable<
    zod.infer<typeof ScenarioFile>['steps'][number]['expect']
>;

export type StepSummary = {
    index: number;
    formId: string;
    description: string;
    at?: string | null;
    // 'not_run' for the steps after a stop
    status: string;
    // what the step checks, as the scenario file says
    expect: StepChecks;
    result?: StepResultOutput;
};

/** Every step of the scenario file, with its result when it ran. */
export const getSteps = (
    definition: unknown,
    lastRun: ScenarioOutcomeOutput | null,
): StepSummary[] => {
    const parsed = ScenarioFile.safeParse(definition);
    const file = parsed.success ? parsed.data : { form: undefined, steps: [] };
    return file.steps.map((step, position) => {
        const result = lastRun?.steps.find(
            stepResult => stepResult.index === position + 1,
        );
        return {
            index: position + 1,
            formId: step.form ?? file.form ?? '',
            description: step.description ?? '',
            at: step.at,
            status: result?.status ?? 'not_run',
            expect: step.expect ?? {},
            result,
        };
    });
};

/** A form's name for people; its form_id when it isn't known. */
export const formName = (forms: FormDescriptions, formId: string): string =>
    forms[formId]?.name || formId;

/** A question's label for people (its name when it has none), from the forms of the run. */
export const questionLabel = (
    forms: FormDescriptions,
    formIds: string[],
    name: string,
): string =>
    formIds.map(formId => forms[formId]?.labels[name]).find(Boolean) ?? name;

/** A value as text, as on the phone; `typed`: with its type, for the technical names. */
export const displayValue = (value: unknown, typed = false): string => {
    if (value === null || value === undefined || value === '') {
        return '—';
    }
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    return typed ? `${text} (${typeof value})` : text;
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** A follow-up condition the query builder can put in words: a JsonLogic object (`{}` is the server's default). */
export const isJsonLogic = (value: unknown): value is JsonLogicTree =>
    isRecord(value) && Object.keys(value).length > 0;
