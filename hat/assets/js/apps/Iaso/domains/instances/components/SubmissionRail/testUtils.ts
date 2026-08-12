import { Entity } from '../../../entities/types/entity';
import { Field } from '../../../entities/types/fields';
import { Instance } from '../../types/instance';

/** Minimal instance fixture for SubmissionRail tests. */
export const makeInstance = (overrides: Partial<Instance> = {}): Instance =>
    ({
        id: 42,
        uuid: 'abc-123',
        device_id: 'device-1',
        file_name: 'submission.xml',
        file_url: '/media/submission.xml',
        form_id: 1,
        form_name: 'Facility survey',
        created_at: 1700000000,
        updated_at: 1700001000,
        source_created_at: 1699999000,
        latitude: 1,
        longitude: 2,
        altitude: 0,
        accuracy: 0,
        files: [],
        status: 'READY',
        export_statuses: [],
        deleted: false,
        org_unit: { id: 7, name: 'Kinshasa' } as Instance['org_unit'],
        period: '2024Q1',
        file_content: {},
        form_descriptor: {},
        last_export_success_at: null,
        instance_locks: [],
        can_user_modify: true,
        is_locked: false,
        is_instance_of_reference_form: false,
        is_reference_instance: false,
        entity: undefined,
        change_requests: [],
        ...overrides,
    }) as Instance;

export const makeEntity = (overrides: Partial<Entity> = {}): Entity =>
    ({
        id: 9,
        uuid: 'entity-uuid',
        name: 'Patient Zero',
        created_at: 1700000000,
        updated_at: 1700001000,
        attributes: {
            age_type: '0',
            latitude: 0,
            longitude: 0,
            name: 'Patient Zero',
        },
        org_unit: { id: 7, name: 'Kinshasa' } as Entity['org_unit'],
        entity_type: 1,
        entity_type_name: 'Beneficiary',
        submitter: 'nurse',
        instances: [],
        ...overrides,
    }) as Entity;

export const makeEntityFields = (): Field[] => [
    { key: 'name', label: 'Name', value: 'Patient Zero' },
    { key: 'age', label: 'Age', value: '12' },
];
