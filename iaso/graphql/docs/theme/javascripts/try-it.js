'use strict';
// Swagger's "Try it out", for each query of the reference, run against `/api/graphql/` as the logged-in user (the
// session cookie of the IASO page serving this reference). Not for the mutations: they would change the real data.
//
// Not SpectaQL's example query: it spreads fragments it never defines and selects every field, geometries included.
// The one to try is built from the schema (introspection, as the user): the plain fields, one level of the related
// objects (`items` of a page), without the costly or bulky ones (`HEAVY`); with the example's variables.

// The query building, apart from the page: loadable outside a browser, to check what it builds.
window.IasoTryIt = (function () {
    // selectable by hand: geometries, per-row counts, big JSON
    var HEAVY = [
        'geom',
        'simplifiedGeom',
        'catchment',
        'submissionCount',
        'formDescriptor',
        'possibleFields',
    ];
    var TYPE_REF =
        'kind name ofType { kind name ofType { kind name ofType { kind name } } }';
    var INTROSPECTION =
        '{ __schema { queryType { name } types { name kind fields { name ' +
        'args { name type { ' +
        TYPE_REF +
        ' } } type { ' +
        TYPE_REF +
        ' } } } } }';

    /** `{root, types}` of an introspection response's `data`. */
    function indexSchema(data) {
        var types = {};
        data.__schema.types.forEach(function (type) {
            types[type.name] = type;
        });
        return { root: data.__schema, types: types };
    }

    function namedType(ref) {
        return ref.ofType ? namedType(ref.ofType) : ref.name;
    }

    function typeString(ref) {
        if (ref.kind === 'NON_NULL') return typeString(ref.ofType) + '!';
        if (ref.kind === 'LIST') return '[' + typeString(ref.ofType) + ']';
        return ref.name;
    }

    /** The lines selecting `type`'s fields, `depth` levels of related objects deep. */
    function selection(types, type, depth, indent) {
        var lines = [];
        type.fields.forEach(function (field) {
            if (HEAVY.indexOf(field.name) >= 0) return;
            var fieldType = types[namedType(field.type)];
            if (fieldType.kind === 'SCALAR' || fieldType.kind === 'ENUM') {
                lines.push(indent + field.name);
            } else if (
                fieldType.kind === 'OBJECT' &&
                depth > 0 &&
                !field.args.length
            ) {
                lines.push(indent + field.name + ' {');
                lines.push.apply(
                    lines,
                    selection(types, fieldType, depth - 1, indent + '  '),
                );
                lines.push(indent + '}');
            }
        });
        return lines;
    }

    function isPage(type) {
        return type.fields.some(function (field) {
            return field.name === 'items';
        });
    }

    /** The `Query` field documented under the anchor `id` (`query-orgUnits`). */
    function queryField(schema, id) {
        var name = id.replace(/^query-/, '');
        return schema.types[schema.root.queryType.name].fields.filter(
            function (field) {
                return field.name === name;
            },
        )[0];
    }

    /**
     * The example's variables, made to work on the user's data - its ids are made up: the filters on an id are
     * dropped. `lookup`: when the query takes the `id` of an object, the query reading the id of one the user can see (`{query, list}`).
     */
    function tryVariables(schema, id, variables) {
        var field = queryField(schema, id);
        var values = JSON.parse(JSON.stringify(variables));
        if (values.filters) {
            Object.keys(values.filters).forEach(function (name) {
                if (/Id(In)?$|^id(In)?$/.test(name))
                    delete values.filters[name];
            });
        }
        var lookup = null;
        var takesId = field.args.some(function (arg) {
            return arg.name === 'id';
        });
        var target = namedType(field.type);
        var list = schema.types[schema.root.queryType.name].fields.filter(
            function (candidate) {
                var page = schema.types[namedType(candidate.type)];
                var items = (page.fields || []).filter(function (pageField) {
                    return pageField.name === 'items';
                })[0];
                return items && namedType(items.type) === target;
            },
        )[0];
        if (takesId && list) {
            lookup = {
                query: '{ ' + list.name + '(limit: 1) { items { id } } }',
                list: list.name,
            };
        }
        return { variables: values, lookup: lookup };
    }

    /** The query documented under the anchor `id` (`query-orgUnits`), with its arguments among `variables`. */
    function buildQuery(schema, id, variables) {
        var field = queryField(schema, id);
        var args = field.args.filter(function (arg) {
            return arg.name in variables;
        });
        var declarations = args.map(function (arg) {
            return '$' + arg.name + ': ' + typeString(arg.type);
        });
        var passed = args.map(function (arg) {
            return arg.name + ': $' + arg.name;
        });
        var returned = schema.types[namedType(field.type)];
        var lines = [
            'query' +
                (declarations.length
                    ? ' (' + declarations.join(', ') + ')'
                    : '') +
                ' {',
            '  ' +
                field.name +
                (passed.length ? '(' + passed.join(', ') + ')' : '') +
                ' {',
        ];
        // a page: its items one level deep, like a single object
        lines.push.apply(
            lines,
            selection(schema.types, returned, isPage(returned) ? 2 : 1, '    '),
        );
        lines.push('  }', '}');
        return lines.join('\n');
    }

    return {
        INTROSPECTION: INTROSPECTION,
        indexSchema: indexSchema,
        tryVariables: tryVariables,
        buildQuery: buildQuery,
    };
})();

window.addEventListener('DOMContentLoaded', function () {
    var ENDPOINT = '/api/graphql/';
    var served = window.location.protocol !== 'file:';
    var schema = null;

    function post(query, variables) {
        return fetch(ENDPOINT, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query, variables: variables || {} }),
        });
    }

    function loadSchema() {
        if (!schema) {
            schema = post(window.IasoTryIt.INTROSPECTION)
                .then(function (response) {
                    return response.json();
                })
                .then(function (body) {
                    if (!body.data) {
                        throw new Error(
                            (body.errors || [{ message: 'no schema' }])[0]
                                .message,
                        );
                    }
                    return window.IasoTryIt.indexSchema(body.data);
                });
            schema.catch(function () {
                schema = null; // logged in since: try again
            });
        }
        return schema;
    }

    function element(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text) node.textContent = text;
        return node;
    }

    function exampleVariables(section) {
        var example = section.querySelector('.operation-variables-example pre');
        try {
            return example ? JSON.parse(example.textContent) : {};
        } catch (error) {
            return {};
        }
    }

    function textarea(className, rows) {
        var input = element('textarea', className);
        input.rows = rows;
        input.spellcheck = false;
        return input;
    }

    function tryIt(section) {
        var examples = section.querySelector('.doc-examples');
        // queries only: a mutation would change the real data
        if (!examples || !/^query-/.test(section.id)) return;
        var variables = exampleVariables(section);

        var toggle = element('button', 'try-it-toggle', 'Try it out');
        toggle.type = 'button';
        if (!served) {
            toggle.disabled = true;
            toggle.title =
                'Open this reference from IASO (/api/graphql/docs/) to run queries';
        }
        var panel = element('div', 'try-it-panel');
        panel.hidden = true;
        panel.appendChild(element('h5', null, 'Query'));
        var queryInput = textarea('try-it-query', 12);
        panel.appendChild(queryInput);
        panel.appendChild(element('h5', null, 'Variables'));
        var variablesInput = textarea('try-it-variables', 6);
        variablesInput.value = JSON.stringify(variables, null, 2);
        panel.appendChild(variablesInput);
        var execute = element('button', 'try-it-execute', 'Execute');
        execute.type = 'button';
        panel.appendChild(execute);
        // GraphiQL (`/api/graphql/`) opens the `?query=...&variables=...` of its URL: autocompletion, history...
        var playground = element('a', 'try-it-playground', 'Open in GraphiQL');
        playground.target = '_blank';
        playground.rel = 'noopener';
        function linkPlayground() {
            var search = new URLSearchParams({ query: queryInput.value });
            if (variablesInput.value.trim())
                search.set('variables', variablesInput.value);
            playground.href = ENDPOINT + '?' + search.toString();
        }
        queryInput.addEventListener('input', linkPlayground);
        variablesInput.addEventListener('input', linkPlayground);
        panel.appendChild(playground);
        var result = element('pre', 'try-it-result');
        result.hidden = true;
        panel.appendChild(result);

        function show(text) {
            result.hidden = false;
            result.textContent = text;
        }

        toggle.addEventListener('click', function () {
            panel.hidden = !panel.hidden;
            toggle.textContent = panel.hidden ? 'Try it out' : 'Cancel';
            if (panel.hidden || queryInput.value) return;
            queryInput.value = 'Loading the schema…';
            loadSchema()
                .then(function (loaded) {
                    var prepared = window.IasoTryIt.tryVariables(
                        loaded,
                        section.id,
                        variables,
                    );
                    var lookup = prepared.lookup
                        ? post(prepared.lookup.query)
                              .then(function (response) {
                                  return response.json();
                              })
                              .then(function (body) {
                                  var items = body.data
                                      ? body.data[prepared.lookup.list].items
                                      : [];
                                  if (items.length)
                                      prepared.variables.id = items[0].id;
                              })
                        : Promise.resolve();
                    return lookup.then(function () {
                        variablesInput.value = JSON.stringify(
                            prepared.variables,
                            null,
                            2,
                        );
                        queryInput.value = window.IasoTryIt.buildQuery(
                            loaded,
                            section.id,
                            prepared.variables,
                        );
                        queryInput.rows = Math.min(
                            queryInput.value.split('\n').length,
                            30,
                        );
                        linkPlayground();
                    });
                })
                .catch(function (error) {
                    queryInput.value = '';
                    show(
                        'Could not read the schema (logged in?): ' +
                            error.message,
                    );
                });
        });

        execute.addEventListener('click', function () {
            var values;
            try {
                values = JSON.parse(variablesInput.value || '{}');
            } catch (error) {
                show('Variables are not valid JSON: ' + error.message);
                return;
            }
            execute.disabled = true;
            show('Running…');
            post(queryInput.value, values)
                .then(function (response) {
                    return response.text().then(function (text) {
                        var body = text;
                        try {
                            body = JSON.stringify(JSON.parse(text), null, 2);
                        } catch (error) {
                            // not JSON: shown as is
                        }
                        show('HTTP ' + response.status + '\n\n' + body);
                    });
                })
                .catch(function (error) {
                    show('Request failed: ' + error.message);
                })
                .then(function () {
                    execute.disabled = false;
                });
        });

        examples.insertBefore(
            panel,
            examples.querySelector('.example-heading').nextSibling,
        );
        examples.insertBefore(toggle, panel);
    }

    document.querySelectorAll('section.operation').forEach(tryIt);
});
