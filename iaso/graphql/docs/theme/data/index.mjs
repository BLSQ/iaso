// SpectaQL's default theme, with the reference grouped by model rather than by kind: each model package's
// `schema.graphql` (`org_units/`, `forms/`...) gives one section with its queries, mutations and types, as does each
// `.graphql` file next to them (`errors.graphql`); the types of `common.graphql` and GraphQL's own scalars end in
// "Shared types". Whatever a new file defines lands in its own section, titled after `GROUPS` or else after its name.
import fs from 'node:fs';
import path from 'node:path';

// run from the repository's root (`npm run graphql-docs`): SpectaQL copies the theme to a temporary directory
const SCHEMA_DIR = path.join(process.cwd(), 'iaso', 'graphql');

const GROUPS = [
    {
        source: 'errors',
        name: 'Errors',
        description:
            'What a refused mutation returns in its `errors`: every problem, with a code, where it is in the input and a message.',
    },
    {
        source: 'forms',
        name: 'Forms',
        description:
            'Forms and their versions: the questionnaires submissions answer.',
    },
    {
        source: 'org_units',
        name: 'Org units',
        description:
            'The pyramid: org units, with their types, groups and source versions.',
    },
    {
        source: 'instances',
        name: 'Submissions',
        description:
            'Submissions of a form, for an org unit and a period, with their answers.',
    },
    {
        source: 'sources',
        name: 'Data sources',
        description:
            'Where org units come from (DHIS2, an import...), in successive versions.',
    },
    {
        source: 'users',
        name: 'Users',
        description:
            'The users of the account, with what they can see: their projects and org units.',
    },
    {
        source: 'tasks',
        name: 'Tasks',
        description:
            'Background jobs queued by a mutation, and their progress.',
    },
];
const SHARED = {
    name: 'Shared types',
    description: 'Scalars and types used by several models.',
};

/** `[source, file]`: each package's `schema.graphql` (by its directory), each other `.graphql` file (by its name). */
function sources() {
    return fs.readdirSync(SCHEMA_DIR).flatMap(name => {
        const file = path.join(SCHEMA_DIR, name, 'schema.graphql');
        if (fs.existsSync(file)) return [[name, file]];
        if (name.endsWith('.graphql') && name !== 'common.graphql') {
            return [
                [name.replace(/\.graphql$/, ''), path.join(SCHEMA_DIR, name)],
            ];
        }
        return [];
    });
}

/** Which source defines each type, and each `Query`/`Mutation` field: `{types: {name: source}, fields: {...}}`. */
function definitions() {
    const types = {};
    const fields = { Query: {}, Mutation: {} };
    for (const [source, file] of sources()) {
        const sdl = fs.readFileSync(file, 'utf8');
        for (const [, name] of sdl.matchAll(
            /^(?:type|input|enum|scalar|interface|union)\s+(\w+)/gm,
        )) {
            types[name] = source;
        }
        // the root fields are the block's lines indented once (arguments and descriptions are indented further, or
        // start with a quote)
        for (const [, root, body] of sdl.matchAll(
            /^extend\s+type\s+(Query|Mutation)\s*\{([\s\S]*?)^\}/gm,
        )) {
            for (const [, field] of body.matchAll(/^ {2}(\w+)\s*[(:]/gm)) {
                fields[root][field] = source;
            }
        }
    }
    return { types, fields };
}

const byName = items => [...items].sort((a, b) => a.name.localeCompare(b.name));

function section(name, items) {
    return items.length
        ? {
              name,
              makeNavSection: true,
              makeContentSection: true,
              items: byName(items),
          }
        : null;
}

export default function arrangeData({ introspectionResponse }) {
    const schema = introspectionResponse.__schema;
    const rootNames = [
        schema.queryType,
        schema.mutationType,
        schema.subscriptionType,
    ]
        .filter(Boolean)
        .map(type => type.name);
    const typesByName = Object.fromEntries(
        schema.types.map(type => [type.name, type]),
    );
    const { types, fields } = definitions();

    const groups = new Map(
        GROUPS.map(group => [
            group.source,
            { ...group, queries: [], mutations: [], types: [] },
        ]),
    );
    const shared = { ...SHARED, queries: [], mutations: [], types: [] };
    const groupOf = source => {
        if (source === undefined) {
            return shared;
        }
        if (!groups.has(source)) {
            groups.set(source, {
                source,
                name: source,
                description: '',
                queries: [],
                mutations: [],
                types: [],
            });
        }
        return groups.get(source);
    };

    for (const field of typesByName.Query?.fields ?? []) {
        groupOf(fields.Query[field.name]).queries.push({
            ...field,
            isQuery: true,
        });
    }
    for (const field of typesByName.Mutation?.fields ?? []) {
        groupOf(fields.Mutation[field.name]).mutations.push({
            ...field,
            isMutation: true,
        });
    }
    for (const type of schema.types) {
        if (type.name.startsWith('__') || rootNames.includes(type.name)) {
            continue; // introspection's own types, and `Query`/`Mutation`, documented by their fields
        }
        groupOf(types[type.name]).types.push({ ...type, isType: true });
    }

    return [...groups.values(), shared]
        .map(group => ({
            name: group.name,
            description: group.description,
            makeContentSection: true,
            items: [
                section('Queries', group.queries),
                section('Mutations', group.mutations),
                section('Types', group.types),
            ].filter(Boolean),
        }))
        .filter(group => group.items.length);
}
