import isPlainObject from 'lodash/isPlainObject';
import { Descriptor } from 'Iaso/domains/instances/components/InstanceFileContentRich';
import { Instance } from 'Iaso/domains/instances/types/instance';

/**
 * Slugification function that matches Django's slugify_underscore behavior
 * Replaces spaces with underscores, converts accented characters to ASCII, and removes parentheses and commas
 * @param value - The string to slugify
 * @returns The slugified string
 */
export const slugifyValue = (value: string): string => {
    return value
        .normalize('NFD') // Decompose characters into base + accent
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (accents)
        .replace(/[(),]/g, '') // Remove parentheses and commas
        .replace(/\s+/g, '_'); // Replace spaces with underscores
};

/**
 * Descriptors are nested structures. This allows to go through the structure
 * looking for the first question that has [key] as name.
 * @param descriptor
 * @param key
 * @returns The first descriptor with the name [key] or undefined if not found
 */
export const findQuestion = (
    descriptor: Descriptor,
    key: string,
): Descriptor | undefined => {
    if (descriptor.name == 'meta' || descriptor.children == null) {
        return undefined;
    }

    for (const child of descriptor.children) {
        if (child.name == key) {
            return child;
        }
        if (child.type == 'repeat' || child.type == 'group') {
            const found = findQuestion(child, key);
            if (found !== undefined) {
                return found;
            }
        }
    }
    return undefined;
};

/**
 * Retrieves the first key where the value is contained in [filePath]
 * @param array The submission's answers
 * @param filePath The path we are looking for
 * @returns The key or undefined if not value was found matching the file path.
 */
export const findKeyForFilePath = (
    array: Record<string, any>,
    filePath: string,
): string | undefined => {
    for (const [key, element] of Object.entries(array)) {
        if (typeof element === 'object') {
            const found = findKeyForFilePath(element, filePath);
            if (found !== undefined) {
                return found;
            }
        } else {
            const slugValue = slugifyValue(element);
            if (filePath.endsWith(slugValue)) {
                return key;
            }
            if (
                slugValue.endsWith('.jpg') &&
                filePath.endsWith(slugValue.replace('.jpg', '.webp'))
            ) {
                return key;
            }
        }
    }
    return undefined;
};

/**
 * Returns the question for a given instance and file path.
 * @param instance The instance with answers and form_descriptor
 * @param filePath The path we are looking for
 * @returns the first descriptor matching the path found in the instance's answers or undefined.
 */
export const findDescriptor = (
    instance: Instance,
    filePath: string,
): Descriptor | undefined => {
    const key = findKeyForFilePath(instance.file_content, filePath);
    if (key == null) {
        return undefined;
    }
    return findQuestion(instance.form_descriptor as Descriptor, key);
};

/**
 * Extract the `xx` code out of a form language key such as "French (fr)".
 * Returns undefined for keys without a parenthesised code (e.g. "default").
 */
const languageCode = (language: string): string | undefined =>
    /\(([a-z]{2})\)\s*$/i.exec(language)?.[1]?.toLowerCase();

/**
 * Render a (possibly multilingual) label in the requested language.
 *
 * `language` may be an exact form language key ("French (fr)", "default") or a
 * short UI locale ("fr", "en"). Resolution order: exact key, then a key whose
 * parenthesised code matches (so "fr" picks "French (fr)"), then the base
 * "default"/English translation, then the first one available.
 * @param label
 * @param language
 * @returns {*}
 */
export const translateLabel = (
    label: Record<string, string> | string,
    language: string,
): string => {
    if (!isPlainObject(label)) {
        return label as string;
    }
    const translations = label as Record<string, string>;
    const keys = Object.keys(translations);
    const match =
        keys.find(key => key === language) ??
        keys.find(key => languageCode(key) === language.toLowerCase()) ??
        keys.find(key => key === 'default' || key.startsWith('English')) ??
        keys[0];
    return match !== undefined ? translations[match] : (label as string);
};

/**
 * The languages a form offers, taken from the descriptor's `_translations`
 * (keyed by language, e.g. "default", "French (fr)"). Falls back to the union
 * of every `label`'s keys when `_translations` is absent, and to an empty list
 * for a monolingual form.
 */
export const getFormLanguages = (descriptor?: Descriptor): string[] => {
    if (!descriptor) return [];
    const translations = descriptor._translations;
    if (isPlainObject(translations)) {
        return Object.keys(translations as Record<string, unknown>);
    }
    const languages = new Set<string>();
    const walk = (node: Descriptor): void => {
        if (isPlainObject(node.label)) {
            Object.keys(node.label as Record<string, string>).forEach(key =>
                languages.add(key),
            );
        }
        node.children?.forEach(walk);
    };
    walk(descriptor);
    return [...languages];
};

/**
 * The language a submission should open in: the one matching the user's UI
 * locale if the form offers it, otherwise the form's own default language,
 * otherwise the first one. Undefined when the form has no languages at all.
 */
export const pickDefaultLanguage = (
    languages: string[],
    uiLocale: string,
    defaultLanguage?: string,
): string | undefined => {
    if (languages.length === 0) return undefined;
    const byLocale = languages.find(
        language => languageCode(language) === uiLocale.toLowerCase(),
    );
    if (byLocale) return byLocale;
    if (defaultLanguage && languages.includes(defaultLanguage)) {
        return defaultLanguage;
    }
    return languages[0];
};
