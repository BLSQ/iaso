import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { getPluginFolders } from '../../apps/Iaso/bundle/plugins';

export type PluginProjectDescriptor = {
    project: string;
    tags: string[] | RegExp[];
    workspace: string;
    mutationInvalidates?: any[];
    schemas?: string[] | RegExp[];
};

const getEnabledPlugins = (): string[] =>
    (process.env.PLUGINS || '')
        .split(',')
        .map(plugin => plugin.trim())
        .filter(Boolean);

let schemaBodyCache: string | null | undefined;

const readSchemaBody = (
    targetFile: string | undefined,
    targetUrl: string,
): string | null => {
    if (schemaBodyCache !== undefined) return schemaBodyCache;
    if (targetFile) {
        try {
            schemaBodyCache = fs.readFileSync(targetFile, 'utf8');
        } catch (error: any) {
            console.warn(
                `Could not read ORVAL_TARGET_FILE ${targetFile}: ${error.message}`,
            );
            schemaBodyCache = null;
        }
        return schemaBodyCache;
    }
    const fetchScript =
        'fetch(process.argv[1], { headers: JSON.parse(process.argv[2]) })' +
        '.then(response => (response.ok ? response.text() : Promise.reject(new Error("HTTP " + response.status))))' +
        '.then(body => process.stdout.write(body))' +
        '.catch(error => { console.error(error.message); process.exit(1); })';
    const headers = JSON.stringify({
        Authorization: `Bearer ${process.env.API_TOKEN}`,
        Accept: 'application/json',
    });
    const result = spawnSync(
        process.execPath,
        ['-e', fetchScript, targetUrl, headers],
        { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 },
    );
    if (result.status === 0) {
        schemaBodyCache = result.stdout;
    } else {
        console.warn(
            `Could not fetch the OpenAPI schema from ${targetUrl}: ${(
                result.stderr || ''
            ).trim()}`,
        );
        schemaBodyCache = null;
    }
    return schemaBodyCache;
};

const schemaHasTag = (
    tag: string | RegExp,
    targetFile: string | undefined,
    targetUrl: string,
): boolean => {
    if (typeof tag !== 'string') return true;
    const body = readSchemaBody(targetFile, targetUrl);
    if (!body) return false;
    return body.includes(`"${tag}"`);
};

export const getPluginProjectDescriptors = ({
    rootDir,
    targetFile,
    targetUrl,
}: {
    rootDir: string;
    targetFile?: string;
    targetUrl: string;
}): PluginProjectDescriptor[] => {
    const descriptors: PluginProjectDescriptor[] = [];
    const enabledPlugins = getEnabledPlugins();
    // getPluginFolders expects the `hat` dir and resolves ../plugins from it.
    getPluginFolders(path.resolve(rootDir, 'hat')).forEach((plugin: string) => {
        const contribPath = path.resolve(
            rootDir,
            `plugins/${plugin}/js/orval.config.cjs`,
        );
        if (!fs.existsSync(contribPath)) return;
        if (!enabledPlugins.includes(plugin)) {
            console.warn(
                `Plugin ${plugin} is not listed in PLUGINS, skipping its orval config.`,
            );
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pluginDescriptors = require(contribPath);
        (Array.isArray(pluginDescriptors) ? pluginDescriptors : []).forEach(
            (descriptor: PluginProjectDescriptor) => {
                const tags = Array.isArray(descriptor.tags)
                    ? descriptor.tags
                    : [];
                const isInSchema = tags.some(tag =>
                    schemaHasTag(tag, targetFile, targetUrl),
                );
                if (tags.length && !isInSchema) {
                    console.warn(
                        `Project ${descriptor.project} of plugin ${plugin}: none of its tags (${tags.join(
                            ', ',
                        )}) was found in the OpenAPI schema, skipping it so its generated client is not emptied.`,
                    );
                    return;
                }
                descriptors.push(descriptor);
            },
        );
    });
    return descriptors;
};
