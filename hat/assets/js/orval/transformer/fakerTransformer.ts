// @ts-nocheck
// see https://github.com/orval-labs/orval/issues/3154

/**
 * Creates an orval input transformer that walks over all schemas in the document and applies a {@link SchemaTransformer} on each
 */
export const createSchemaTransformer = schemaTransformer => {
    return specs => {
        // Normalize shared components
        if (specs.components?.schemas) {
            Object.values(specs.components.schemas).forEach(schemaTransformer);
        }

        // Normalize inline schemas in paths (responses, parameters, body)
        Object.values(specs.paths || {}).forEach(path => {
            if (!path) return;

            Object.values(path).forEach(operation => {
                if (!operation) return;

                // Params (Query/Path)
                operation.parameters?.forEach(
                    p => void schemaTransformer(p.schema),
                );

                // Request Body
                const bodySchema =
                    operation.requestBody?.content?.['application/json']
                        ?.schema;
                if (bodySchema) schemaTransformer(bodySchema);

                // Responses
                if (operation.responses) {
                    Object.values(operation.responses).forEach(res => {
                        const s = res?.content?.['application/json']?.schema;
                        if (s) schemaTransformer(s);
                    });
                }
            });
        });

        return specs;
    };
};

/**
 * We only have this because faker is not good enough interpreting regexps
 */
export const normalizeSchema = schema => {
    if (!schema || typeof schema !== 'object') return schema;

    if (schema.pattern && typeof schema.pattern === 'string') {
        // Stripping ^ and $ prevents Faker from generating them literally.
        // Zod validation remains effective due to minLength/maxLength.
        schema.pattern = schema.pattern.replace(/^\^|\$$/g, '');
    }

    // --- 3. Recursive Traversal ---
    if (schema.properties) {
        Object.values(schema.properties).forEach(normalizeSchema);
    }
    if (Array.isArray(schema.items)) {
        // Handle positional arrays (OAS 3.1 / JSON Schema Tuples)
        schema.items.forEach(normalizeSchema);
    } else if (schema.items && typeof schema.items === 'object') {
        // Handle standard arrays
        normalizeSchema(schema.items);
    }

    // Handle polymorphism (The "forgotten" recursion points)
    if (schema.oneOf) schema.oneOf.forEach(normalizeSchema);
    if (schema.anyOf) schema.anyOf.forEach(normalizeSchema);
    if (
        schema.additionalProperties &&
        typeof schema.additionalProperties === 'object'
    ) {
        normalizeSchema(schema.additionalProperties);
    }

    return schema;
};
