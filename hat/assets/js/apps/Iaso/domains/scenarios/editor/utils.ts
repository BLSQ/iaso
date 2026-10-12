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

/** An external app question to answer (`intent="ex:..."`), as web-forms asks for it. */
export type IntentRequest = {
    action: string;
    parameters: Record<string, string>;
    // the question's reference: a repeat instance's own
    reference: string;
};

/** What the app returned, by name: web-forms puts each value in the question of that name. */
export type IntentResult = Record<string, string>;

/** The org unit picker's action (`${applicationId}.action.pick_ou`), whatever the app's id. */
export const isPickOrgUnit = (action: string): boolean =>
    action.endsWith('.action.pick_ou');

type PickedOrgUnit = {
    id: number;
    name: string;
    parent_id?: number | null;
    org_unit_type_id?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    // the ancestors, the closest first
    parent?: PickedOrgUnit | null;
};

/**
 * The app's `pick_ou` result (`OrgUnitFragment.onPickModeOUPicked`): its fields, each renamed by the `map` parameter
 * (`id:ou_id;name:ou_name`, the app's field then the form's question) - the empty ones left out.
 */
export const pickedOrgUnitResult = (
    orgUnit: PickedOrgUnit,
    parameters: Record<string, string>,
): IntentResult => {
    const ancestors: string[] = [];
    for (let parent = orgUnit.parent; parent; parent = parent.parent) {
        ancestors.unshift(parent.name);
    }
    const fields: Record<string, unknown> = {
        id: orgUnit.id,
        name: orgUnit.name,
        parentId: orgUnit.parent_id ?? orgUnit.parent?.id,
        orgUnitTypeId: orgUnit.org_unit_type_id,
        latitude: orgUnit.latitude,
        longitude: orgUnit.longitude,
        path: ancestors.join('/'),
    };
    const map = Object.fromEntries(
        (parameters.map ?? '')
            .split(';')
            .map(pair => pair.split(':'))
            .filter(pair => pair.length === 2),
    );
    return Object.fromEntries(
        Object.entries(fields)
            .filter(
                ([, value]) =>
                    value !== undefined && value !== null && value !== '',
            )
            .map(([field, value]) => [map[field] ?? field, String(value)]),
    );
};
