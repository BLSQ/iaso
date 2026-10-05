// Realistic examples for the GraphQL reference (`npm run graphql-docs`, see `spectaql.yml`): one health center, its
// district and region, and a monthly report submitted for it - the same ids and names everywhere. Written to the
// metadata file SpectaQL reads; a type or field that isn't in the schema files fails the build rather than being
// silently ignored. Unlisted fields get SpectaQL's generic examples.
import fs from 'node:fs';
import path from 'node:path';

const SCHEMA_DIR = path.join(process.cwd(), 'iaso', 'graphql');
const OUTPUT = path.join(
    process.cwd(),
    'hat',
    'assets',
    'graphql',
    'examples.json',
);
const f = fields =>
    Object.fromEntries(
        Object.entries(fields).map(([k, v]) => [
            k,
            { documentation: { example: v } },
        ]),
    );
const geom = {
    type: 'MultiPolygon',
    coordinates: [
        [
            [
                [-12.061, 8.871],
                [-12.031, 8.869],
                [-12.028, 8.894],
                [-12.058, 8.897],
                [-12.061, 8.871],
            ],
        ],
    ],
};

const objects = {
    OrgUnit: {
        id: 1287,
        name: 'Kanda Central Health Center',
        uuid: '3f2b8c1e-5d7a-4e0b-9c41-7a2e6d1f0b93',
        validationStatus: 'VALID',
        sourceRef: 'Kq3uV9xPmL2',
        code: 'HC_KANDA_CENTRAL',
        aliases: ['Kanda CHC'],
        openingDate: '1998-03-01',
        closedDate: null,
        createdAt: '2023-02-14T09:21:07.512000+00:00',
        updatedAt: '2024-06-03T15:40:12.004000+00:00',
        sourceCreatedAt: '2023-02-14T08:55:31+00:00',
        parentId: 1043,
        orgUnitTypeId: 4,
        versionId: 9,
        depth: 4,
        hasGeoJson: true,
        hasGeometry: true,
        hasChildren: false,
        submissionCount: 128,
        geom,
        simplifiedGeom: geom,
        catchment: null,
    },
    OrgUnitSummary: {
        id: 1043,
        name: 'Kanda District',
        sourceRef: 'Ws8nT2cYbQe',
        validationStatus: 'VALID',
        orgUnitTypeId: 3,
        parentId: 12,
    },
    SubmissionOrgUnit: {
        id: 1287,
        name: 'Kanda Central Health Center',
        sourceRef: 'Kq3uV9xPmL2',
        validationStatus: 'VALID',
        orgUnitTypeId: 4,
        parentId: 1043,
    },
    OrgUnitType: {
        id: 4,
        name: 'Health Center',
        shortName: 'HC',
        category: 'HF',
        depth: 3,
        createdAt: '2022-03-14T10:05:40.000000+00:00',
        updatedAt: '2024-01-09T16:20:03.000000+00:00',
    },
    OrgUnitTypeSummary: {
        id: 4,
        name: 'Health Center',
        shortName: 'HC',
        category: 'HF',
        depth: 3,
    },
    Group: {
        id: 15,
        name: 'Public health facilities',
        sourceRef: 'GpHfPub001',
        blockOfCountries: false,
        createdAt: '2022-03-14T10:06:12.000000+00:00',
        updatedAt: '2024-06-02T07:31:45.000000+00:00',
        sourceVersionId: 9,
    },
    GroupSummary: {
        id: 15,
        name: 'Public health facilities',
        sourceRef: 'GpHfPub001',
    },
    SourceVersion: {
        id: 9,
        number: 3,
        description: 'Import of June 2024 from the national DHIS2',
        createdAt: '2024-06-02T07:30:00.000000+00:00',
        updatedAt: '2024-06-02T07:30:00.000000+00:00',
        dataSourceId: 2,
    },
    SourceVersionSummary: {
        id: 9,
        number: 3,
        description: 'Import of June 2024 from the national DHIS2',
        createdAt: '2024-06-02T07:30:00.000000+00:00',
        updatedAt: '2024-06-02T07:30:00.000000+00:00',
    },
    DataSource: {
        id: 2,
        name: 'National health facility registry',
        description:
            'The reference list of health facilities, synced from DHIS2',
        readOnly: false,
        public: false,
        createdAt: '2022-03-14T10:02:11.000000+00:00',
        updatedAt: '2024-06-02T07:30:00.000000+00:00',
        treeConfigStatusFields: ['VALID', 'NEW'],
        defaultVersionId: 9,
    },
    DataSourceSummary: {
        id: 2,
        name: 'National health facility registry',
        readOnly: false,
        public: false,
    },
    Location: { latitude: 8.8811, longitude: -12.0457, altitude: 312 },
    UserSummary: {
        id: 52,
        username: 'fkamara',
        firstName: 'Fatou',
        lastName: 'Kamara',
        email: 'fkamara@example.org',
    },
    User: {
        id: 52,
        profileId: 48,
        username: 'fkamara',
        firstName: 'Fatou',
        lastName: 'Kamara',
        email: 'fkamara@example.org',
        isActive: true,
        dateJoined: '2023-01-16T08:42:10.000000+00:00',
        lastLogin: '2024-06-03T07:58:21.000000+00:00',
        language: 'en',
        phoneNumber: '+23276123456',
        organization: 'District health team',
        dhis2Id: 'xE7jOejl9FI',
    },
    Project: { id: 2, name: 'Health facility monitoring' },
    Form: {
        id: 7,
        uuid: 'b6d0a7f4-2c3e-4f19-8a65-0e9d3c21f7aa',
        name: 'Monthly health facility report',
        odkFormId: 'monthly_hf_report',
        periodType: 'MONTH',
        singlePerPeriod: true,
        periodsBeforeAllowed: 3,
        periodsAfterAllowed: 0,
        deviceField: 'deviceid',
        locationField: 'gps',
        correlatable: false,
        correlationField: null,
        derived: false,
        labelKeys: ['facility_name'],
        createdAt: '2022-11-08T13:02:44.871000+00:00',
        updatedAt: '2024-05-27T08:15:03.220000+00:00',
        legendThreshold: null,
    },
    FormSummary: {
        id: 7,
        name: 'Monthly health facility report',
        odkFormId: 'monthly_hf_report',
        periodType: 'MONTH',
        singlePerPeriod: true,
    },
    FormVersion: {
        id: 31,
        versionId: '2024052701',
        formId: 7,
        createdAt: '2024-05-27T08:15:03.220000+00:00',
        updatedAt: '2024-05-27T08:15:03.220000+00:00',
        startPeriod: '202406',
        endPeriod: null,
        fileUrl:
            'https://iaso.example.org/media/forms/monthly_hf_report_2024052701.xml',
        xlsFileUrl:
            'https://iaso.example.org/media/forms/monthly_hf_report_2024052701.xlsx',
    },
    FormVersionSummary: {
        id: 31,
        versionId: '2024052701',
        startPeriod: '202406',
        endPeriod: null,
        createdAt: '2024-05-27T08:15:03.220000+00:00',
    },
    Submission: {
        id: 98231,
        uuid: 'c41e9b02-7f6d-4a38-b5e2-90d1c3a8e6f4',
        formId: 7,
        formVersionId: 31,
        orgUnitId: 1287,
        projectId: 2,
        period: '202405',
        status: 'READY',
        createdAt: '2024-06-01T10:12:44.123000+00:00',
        updatedAt: '2024-06-01T10:12:47.902000+00:00',
        sourceCreatedAt: '2024-05-31T16:48:02+00:00',
        sourceUpdatedAt: '2024-05-31T16:52:19+00:00',
        createdById: 52,
        lastModifiedById: 52,
        accuracy: 4.5,
        deviceId: 'collect:Xk3pQ9vLr2Tn',
        entityId: null,
        planningId: null,
        isReferenceSubmission: false,
        deleted: false,
        fileName: 'monthly_hf_report_2024-05-31_16-48-02.xml',
        exportId: null,
        content: {
            facility_name: 'Kanda Central Health Center',
            facility_open: 'yes',
            consultations: '412',
            malaria_cases: '37',
            gps: '8.8811 -12.0457 312 4.5',
            meta: { instanceID: 'uuid:c41e9b02-7f6d-4a38-b5e2-90d1c3a8e6f4' },
        },
    },
    Near: { longitude: -12.0457, latitude: 8.8811, distanceMeters: 5000 },
    Task: {
        id: 4521,
        name: 'org_units_graphql_bulk_update',
        status: 'RUNNING',
        progressValue: 300,
        endValue: 1250,
        progressMessage: '300 of 1250 org units processed',
        result: null,
        createdAt: '2024-06-03T15:40:10.551000+00:00',
        startedAt: '2024-06-03T15:40:11.020000+00:00',
        endedAt: null,
        shouldBeKilled: false,
    },
    OrgUnitPage: { hasNextPage: true, totalCount: 312 },
    SubmissionPage: { hasNextPage: true, totalCount: 1840 },
    FormPage: { hasNextPage: false, totalCount: 4 },
    FormVersionPage: { hasNextPage: false, totalCount: 6 },
    FormVersionWarning: {
        code: 'QUESTION_TYPE_CHANGED',
        message:
            "Question 'consultations' changes type, integer -> text: the answers already collected may not fit",
        question: 'consultations',
    },
    SubmissionError: {
        code: 'INVALID',
        message: 'More consultations than people in the catchment area',
        field: ['answers', '0', 'value'],
        question: 'consultations',
    },
    FormVersionError: {
        code: 'INVALID_XLSFORM',
        message:
            "survey sheet, row 12: duplicated question name 'consultations'",
        field: ['xlsFile'],
        question: 'consultations',
    },
    OrgUnitBulkUpdateError: {
        code: 'NOT_FOUND',
        message: 'Org unit 1043 does not exist',
        field: ['update', 'parentId'],
        question: null,
    },
    TaskLog: {
        id: 88310,
        message: '300 of 1250 org units processed',
        createdAt: '2024-06-03T15:40:14.774000+00:00',
    },
};

const inputs = {
    OrgUnitFilter: {
        idIn: [1287, 1291, 1302],
        orgUnitTypeId: 4,
        ancestorId: 1043,
        validationStatus: 'VALID',
        name: 'Kanda Central Health Center',
        nameIContains: 'health center',
        nameStartsWith: 'Kanda',
        search: 'Kanda CHC',
        sourceRef: 'Kq3uV9xPmL2',
        sourceRefIn: ['Kq3uV9xPmL2', 'Pz7rD4aHnW1'],
        sourceRefStartsWith: 'Kq3',
        code: 'HC_KANDA_CENTRAL',
        codeIn: ['HC_KANDA_CENTRAL', 'HC_KANDA_EAST'],
        orgUnitTypeNameIContains: 'health',
        parentNameIContains: 'kanda',
        parentSourceRef: 'Ws8nT2cYbQe',
    },
    OrgUnitBulkUpdate: {
        validationStatus: 'VALID',
        orgUnitTypeId: 4,
        parentId: 1043,
        groupIdsAdded: [15],
        groupIdsRemoved: [16],
    },
    SubmissionFilter: {
        formId: 7,
        formNameIContains: 'health facility',
        period: '202405',
        periodIn: ['202404', '202405'],
        periodGte: '202401',
        periodLte: '202412',
        orgUnitAncestorId: 1043,
        orgUnitNameIContains: 'health center',
        orgUnitSourceRef: 'Kq3uV9xPmL2',
        deviceId: 'collect:Xk3pQ9vLr2Tn',
    },
    FormFilter: {
        nameIContains: 'health facility',
        projectId: 2,
        odkFormId: 'monthly_hf_report',
        odkFormIdIn: ['monthly_hf_report', 'hf_census'],
    },
    FormVersionFilter: { formId: 7, versionId: '2024052701' },
    UserFilter: { search: 'kamara', projectId: 2, orgUnitId: 1043 },
    OrgUnitTypeFilter: { search: 'health', category: 'HF', projectId: 2 },
    GroupFilter: { nameIContains: 'public', defaultVersion: true },
    DataSourceFilter: {
        nameIContains: 'registry',
        projectId: 2,
        hasVersions: true,
    },
    SourceVersionFilter: { dataSourceId: 2, isDefault: true },
    AnswerInput: { path: 'consultations', value: '415' },
    Bbox: { minx: -12.2, miny: 8.7, maxx: -11.9, maxy: 9.0 },
};

const args = {
    Query: {
        // a few filters, not all those of the input type
        orgUnits: {
            filters: {
                orgUnitTypeId: 4,
                ancestorId: 1043,
                validationStatus: 'VALID',
            },
            limit: 50,
        },
        submissions: {
            filters: { formId: 7, period: '202405', orgUnitAncestorId: 1043 },
            limit: 20,
        },
        forms: { filters: { projectId: 2 } },
        formVersions: { filters: { formId: 7 } },
        dataSources: { filters: { projectId: 2 } },
        orgUnitTypes: { filters: { projectId: 2 } },
        users: { filters: { projectId: 2, isActive: true } },
        user: { id: 52 },
        orgUnitType: { id: 4 },
        groups: { filters: { defaultVersion: true } },
        group: { id: 15 },
        sourceVersions: { filters: { dataSourceId: 2 } },
        dataSource: { id: 2 },
        sourceVersion: { id: 9 },
        orgUnit: { id: 1287 },
        submission: { id: 98231 },
        form: { id: 7 },
        formVersion: { id: 31 },
        task: { id: 4521 },
        taskLogs: { taskId: 4521, afterId: 88302 },
    },
    Mutation: {
        updateSubmissionPeriod: { id: 98231, period: '202405' },
        updateSubmissionOrgUnit: { id: 98231, orgUnitId: 1287 },
        updateSubmissionContent: {
            id: 98231,
            answers: [{ path: 'consultations', value: '415' }],
        },
        createFormVersion: {
            formId: 7,
            xlsFile: null,
            startPeriod: '202406',
            endPeriod: null,
            force: false,
        },
        bulkUpdateOrgUnits: {
            // the ids of the org units selected: exactly those, whatever changes before the task runs
            filters: { idIn: [1287, 1291, 1302] },
            update: { validationStatus: 'VALID', groupIdsAdded: [15] },
        },
    },
};

const OBJECT = Object.fromEntries(
    Object.entries(objects).map(([type, fields]) => [
        type,
        { fields: f(fields) },
    ]),
);
for (const [root, fields] of Object.entries(args)) {
    OBJECT[root] = {
        fields: Object.fromEntries(
            Object.entries(fields).map(([field, a]) => [field, { args: f(a) }]),
        ),
    };
}
const metadata = {
    OBJECT,
    INPUT_OBJECT: Object.fromEntries(
        Object.entries(inputs).map(([type, fields]) => [
            type,
            { inputFields: f(fields) },
        ]),
    ),
    SCALAR: {
        Date: { documentation: { example: '2024-05-31' } },
        DateTime: {
            documentation: { example: '2024-06-01T10:12:44.123000+00:00' },
        },
        JSON: { documentation: { example: {} } },
    },
};
checkAgainstSchema();
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(metadata, null, 2) + '\n');

/** Each example's type, field and argument is in a `.graphql` file. */
function checkAgainstSchema() {
    // the top-level `.graphql` files (`common.graphql`, `errors.graphql`) and each package's `schema.graphql`
    const sdl = fs
        .readdirSync(SCHEMA_DIR)
        .map(name =>
            name.endsWith('.graphql')
                ? path.join(SCHEMA_DIR, name)
                : path.join(SCHEMA_DIR, name, 'schema.graphql'),
        )
        .filter(file => fs.existsSync(file))
        .map(file => fs.readFileSync(file, 'utf8'))
        .join('\n');
    const blocks = type =>
        [
            ...sdl.matchAll(
                new RegExp(
                    `^(?:extend\\s+)?(?:type|input)\\s+${type}\\b[^{]*\\{([\\s\\S]*?)^\\}`,
                    'gm',
                ),
            ),
        ]
            .map(match => match[1])
            .join('\n');
    const missing = [];
    const check = (type, names, pattern) => {
        const body = blocks(type);
        if (!body) {
            missing.push(type);
        }
        for (const name of names) {
            if (body && !pattern(name).test(body)) {
                missing.push(`${type}.${name}`);
            }
        }
    };
    for (const [type, fields] of Object.entries({ ...objects, ...inputs })) {
        check(
            type,
            Object.keys(fields),
            name => new RegExp(`^ {2}${name}\\s*[(:]`, 'm'),
        );
    }
    for (const [root, fields] of Object.entries(args)) {
        check(
            root,
            Object.keys(fields),
            name => new RegExp(`^ {2}${name}\\s*\\(`, 'm'),
        );
        for (const [field, fieldArgs] of Object.entries(fields)) {
            const signature =
                blocks(root).match(
                    new RegExp(`^ {2}${field}\\s*\\(([\\s\\S]*?)\\)\\s*:`, 'm'),
                )?.[1] ?? '';
            missing.push(
                ...Object.keys(fieldArgs)
                    .filter(
                        arg => !new RegExp(`\\b${arg}\\s*:`).test(signature),
                    )
                    .map(arg => `${root}.${field}(${arg})`),
            );
        }
    }
    if (missing.length) {
        throw new Error(
            `Examples for what isn't in the schema: ${missing.join(', ')}`,
        );
    }
}
