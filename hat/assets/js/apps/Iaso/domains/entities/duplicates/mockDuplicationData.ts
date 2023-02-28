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
    first_name: 'Retsu',
    last_name: 'Ichijouji',
    date_of_birth: '2022-08-16T13:26:22.470058Z',
    father_name: 'Voicer',
    gender: 'M',
};

const baseEntity = {
    created_at: '2022-08-16T13:26:22.470058Z',
    updated_at: '2022-08-16T13:26:22.470058Z',
    id: 1,
    form: { name: 'CODA-Registration', id: 85 },
    org_unit: { name: 'bu Ango Hôpital Général de Référence', id: 104099 },
    entity_type: { name: 'Children under 5', id: 11 },
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
