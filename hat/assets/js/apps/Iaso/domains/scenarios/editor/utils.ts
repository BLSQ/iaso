import { z as zod } from 'zod';
import { EditorQuestion } from 'Iaso/api/scenarios';

export type StepExpect = {
    next_forms?: string[];
    attributes?: Record<string, string | null>;
    refused?: { question: string; code: string }[];
};

/** A step as the scenario file holds it. */
export type EditorStep = {
    form: string;
    description: string;
    at: string | null;
    answers: Record<string, string>;
    expect: StepExpect;
    force?: boolean;
    // registration only: the search the app asks for before the form, question -> value typed or scanned
    search?: Record<string, string>;
};

/** The scenario file of the steps (`format` iaso-scenarios/1, entity scenario). */
export const toDefinition = (
    name: string,
    description: string,
    steps: EditorStep[],
): Record<string, unknown> => ({
    format: 'iaso-scenarios/1',
    kind: 'entity',
    name,
    description,
    steps: steps.map(({ at, force, search, ...step }) => ({
        ...step,
        ...(at ? { at } : {}),
        ...(force ? { force } : {}),
        ...(search && Object.keys(search).length > 0 ? { search } : {}),
    })),
});

const FileSteps = zod.object({
    steps: zod
        .array(
            zod.object({
                form: zod.string(),
                description: zod.string().default(''),
                at: zod.string().nullish(),
                answers: zod.record(zod.string(), zod.string()).default({}),
                expect: zod
                    .object({
                        next_forms: zod.array(zod.string()).nullish(),
                        attributes: zod
                            .record(zod.string(), zod.string().nullable())
                            .optional(),
                        refused: zod
                            .array(
                                zod.object({
                                    question: zod.string(),
                                    code: zod.string(),
                                }),
                            )
                            .nullish(),
                    })
                    .passthrough()
                    .default({}),
                force: zod.boolean().optional(),
                search: zod.record(zod.string(), zod.string()).optional(),
            }),
        )
        .default([]),
});

/** The steps of a scenario file (an existing scenario opened in the editor); none when it can't be read. */
export const fromDefinition = (definition: unknown): EditorStep[] => {
    const parsed = FileSteps.safeParse(definition);
    if (!parsed.success) {
        return [];
    }
    return parsed.data.steps.map(step => ({
        form: step.form,
        description: step.description,
        at: step.at ?? null,
        answers: step.answers,
        expect: {
            ...step.expect,
            next_forms: step.expect.next_forms ?? undefined,
            refused: step.expect.refused ?? undefined,
        },
        force: step.force,
        search: step.search,
    }));
};

/**
 * The answers given in web-forms, from the submission it posts: the questions a person answers, not empty, and not
 * the values the form was prefilled with (the phone prefills them again on every run).
 */
export const answersFromSubmission = (
    xml: string,
    questions: EditorQuestion[],
    prefilled: Record<string, string>,
): Record<string, string> => {
    const instance = new DOMParser().parseFromString(xml, 'text/xml');
    const elements = Array.from(instance.getElementsByTagName('*'));
    const answers: Record<string, string> = {};
    questions.forEach(question => {
        const element = elements.find(
            candidate =>
                candidate.localName === question.name &&
                candidate.children.length === 0,
        );
        const value = element?.textContent ?? '';
        if (value !== '' && prefilled[question.name] !== value) {
            answers[question.name] = value;
        }
    });
    return answers;
};

/** The search lets the app register: every question answered when it prevents adding without them. */
export const searchAllowsRegistering = (
    questions: { name: string }[],
    preventAdd: boolean,
    search: Record<string, string>,
): boolean =>
    !preventAdd ||
    questions.every(question => (search[question.name] ?? '').trim() !== '');
