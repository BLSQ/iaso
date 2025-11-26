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
            if (filePath.includes(slugValue)) {
                return key;
            }
            if (
                slugValue.endsWith('.jpg') &&
                filePath.includes(slugValue.replace('.jpg', '.webp'))
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
 * Translate the provided label if it is translatable
 * If the locale language matches the user language, we display it
 * if not, we display it in English by default
 * if there is no english version, we display the first one
 * @param label
 * @returns {*}
 */

const labelLocales = { fr: 'French', en: 'English' };

export const translateLabel = (
    label: Record<string, string> | string,
    activeLocale: string,
): string => {
    if (isPlainObject(label)) {
        const correctKey = Object.keys(label as Record<string, string>).find(
            key => {
                if (
                    labelLocales[
                        activeLocale as keyof typeof labelLocales
                    ]?.includes(key)
                ) {
                    return true;
                }
                return labelLocales.en.includes(key);
            },
        );

        if (correctKey) {
            return (label as Record<string, string>)[correctKey];
        }
        return (label as Record<string, string>)[
            Object.keys(label as Record<string, string>)[0]
        ];
    }

    return label as string;
};
