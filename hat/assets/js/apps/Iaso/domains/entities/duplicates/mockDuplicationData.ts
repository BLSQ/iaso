/* eslint-disable camelcase */
import { cloneDeep } from 'lodash';
import { DuplicateData, DuplicateEntity, DuplicatesList } from './types';

type DummyEntityFields = {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    father_name: string;
    gender: string;
};

type MakeDuplicateArgs = {
    entity: DuplicateEntity;
    newEntityId: number;
    fields: Partial<DummyEntityFields>;
};

const baseEntityFields = {
    first_name: 'David',
    last_name: 'Jones',
    date_of_birth: '2022-08-16T13:26:22.470058Z',
    father_name: 'Voicer',
    gender: 'M',
};

const baseEntity = {
    created_at: '2022-08-16T13:26:22.470058Z',
    updated_at: '2022-08-16T13:26:22.470058Z',
    id: 1,
    // form: { name: 'CODA-Registration', id: 85 },
    // entity_type: { name: 'Children under 5', id: 11 },
    org_unit: { name: 'bu Ango Hôpital Général de Référence', id: 104099 },
    json: baseEntityFields,
};

const makeDuplicateEntity = ({
    entity,
    newEntityId,
    fields,
}: MakeDuplicateArgs): DuplicateEntity => {
    const copy = cloneDeep(entity);
    return {
        ...copy,
        id: newEntityId,
        json: { ...baseEntityFields, ...fields },
    };
};

type MakeTableResponseArgs = {
    count: number;
    has_next: boolean;
    has_previous: boolean;
    limit?: number;
};
export const mockDuplicatesTableResponse = ({
    count,
    has_next,
    has_previous,
    limit = 10,
}: MakeTableResponseArgs): DuplicatesList => {
    const response: DuplicatesList = {
        count,
        has_next,
        has_previous,
        page: 1,
        pages: Math.ceil(count / limit),
        limit,
        results: [] as DuplicateData[],
    };
    // returning only a number === limit
    for (let i = 1; i <= limit; i += 1) {
        const duplicate = makeDuplicateEntity({
            entity: baseEntity,
            newEntityId: i + 1,
            fields: {
                date_of_birth: '2022-08-17T13:26:22.470058Z',
                first_name: `${baseEntity.json.first_name}${i}`,
            },
        });
        const duplicatesWithData: DuplicateData = {
            form: { name: 'CODA-Registration', id: 85 },
            entity_type: { name: 'Children under 5', id: 11 },
            fields: [
                {
                    field: 'first_name',
                    label: { English: 'First name', French: 'Prénom' },
                },
                { field: 'last_name', label: 'Last name' },
                {
                    field: 'date_of_birth',
                    label: {
                        English: 'Date of birth',
                        French: 'Date de naissance',
                    },
                },
            ],
            entity1: baseEntity,
            entity2: duplicate,
            ignored: false,
            similarity: 200,
            similarity_star: 4,
            algorithms: [
                {
                    analyze_id: '1',
                    type: 'namesim',
                    fields: ['first_name', 'last_name', 'date_of_birth'],
                    similarity: 200,
                    similarity_star: 4,
                },
            ],
        };
        response.results.push(duplicatesWithData);
    }

    return response;
};

export const mockDuplicatesDetailsResponse = () => {
    const duplicate = makeDuplicateEntity({
        entity: baseEntity,
        newEntityId: 2,
        fields: {
            date_of_birth: '2022-08-17T13:26:22.470058Z',
            first_name: `${baseEntity.json.first_name}${1}`,
        },
    });
    return [
        {
            form: { name: 'CODA-Registration', id: 85 },
            entity_type: { name: 'Children under 5', id: 11 },
            fields: [
                {
                    field: 'first_name',
                    label: { English: 'First name', French: 'Prénom' },
                },
                { field: 'last_name', label: 'Last name' },
                {
                    field: 'date_of_birth',
                    label: {
                        English: 'Date of birth',
                        French: 'Date de naissance',
                    },
                },
            ],
            entity1: baseEntity,
            entity2: duplicate,
            ignored: false,
            similarity: 200,
            similarity_star: 4,
            algorithms: [
                {
                    analyze_id: '1',
                    type: 'namesim',
                    fields: ['first_name', 'last_name', 'date_of_birth'],
                    similarity: 200,
                    similarity_star: 4,
                },
            ],
        },
    ];
};

// entity should have {value, id} shape
export const mockDuplicatesDetailsTableData = () => {
    return [
        {
            field: {
                field: 'first_name',
                label: { English: 'First name', French: 'Prénom' },
            },
            entity1: { value: 'David', id: 1 },
            entity2: { value: 'David0', id: 2 },
            final: { value: '' },
        },
        {
            field: { field: 'last_name', label: 'Last name' },
            entity1: { value: 'Jones', id: 1 },
            entity2: { value: 'Jones', id: 2 },
            final: { value: 'Jones', id: 1 }, // randomly using the id of the 1st entity, since the value is the same
        },
        {
            field: {
                field: 'date_of_birth',
                label: {
                    English: 'Date of birth',
                    French: 'Date de naissance',
                },
            },
            entity1: { id: 1, value: '2022-08-16T13:26:22.470058Z' },
            entity2: { id: 2, value: '2022-08-17T13:26:22.470058Z' },
            final: { value: '' },
        },
        {
            field: {
                field: 'stage_name',
                label: { English: 'Stage name', French: 'Nom de scène' },
            },
            entity1: { value: 'David Bowie', id: 1 },
            entity2: { value: 'Ziggy Stardust', id: 2 },
            final: { value: '' },
        },
    ];
};

export const mockEntitiesInfo = () => {
    const duplicate = makeDuplicateEntity({
        entity: baseEntity,
        newEntityId: 2,
        fields: {
            date_of_birth: '2022-08-17T13:26:22.470058Z',
            first_name: `${baseEntity.json.first_name}${1}`,
        },
    });

    return [
        {
            form: { name: 'CODA-Registration', id: 85 },
            entity_type: { name: 'Children under 5', id: 11 },
            fields: [
                {
                    field: 'first_name',
                    label: { English: 'First name', French: 'Prénom' },
                },
                { field: 'last_name', label: 'Last name' },
                {
                    field: 'date_of_birth',
                    label: {
                        English: 'Date of birth',
                        French: 'Date de naissance',
                    },
                },
            ],
            entity1: baseEntity,
            entity2: duplicate,
            ignored: false,
            similarity: 200,
            similarity_star: 4,
            algorithms: [
                {
                    analyze_id: '1',
                    type: 'namesim',
                    fields: ['first_name', 'last_name', 'date_of_birth'],
                    similarity: 200,
                    similarity_star: 4,
                },
            ],
        },
    ];
};

export const mergedEntity = {
    id: 2,
    uuid: '7f0be2bc-16b8-4532-ae0d-c3712e0539aa',
    name: 'Lisa Sampson',
    created_at: '2022-08-16T13:26:22.470058Z',
    updated_at: '2022-08-16T13:26:22.470058Z',
    attributes: 5,
    entity_type: 11,
    entity_type_name: 'Children under 5',
};
