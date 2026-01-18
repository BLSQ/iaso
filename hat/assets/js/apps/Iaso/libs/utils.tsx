/**
 * Get request with params passed as query params
 * Remove undefined params
 * @param {string} url
 * @param {{[p: string]: T}} urlParams
 */

import React, { ReactElement } from 'react';
import { textPlaceholder } from 'bluesquare-components';
import { OptionsResponse } from '../types/general';
import { DropdownOptions, Nullable, Optional } from '../types/utils';

// url should include closing slash
export const makeUrlWithParams = (
    url: string,
    urlParams: Record<string, string | number | boolean | undefined>,
): string => {
    // @ts-ignore
    const urlSearchParams = new URLSearchParams();

    Object.entries(urlParams).forEach(([k, v]) => {
        if (Array.isArray(v)) {
            v.forEach(p => urlSearchParams.append(k, p));
        } else if (typeof v === 'number') {
            urlSearchParams.append(k, v.toString());
        } else if (v !== undefined) {
            urlSearchParams.append(k, v);
        }
    });

    return `${url}?${urlSearchParams.toString()}`;
};

// Credit yup source code: https://github.com/jquense/yup/blob/master/src/string.ts
export const emailRegex =
    // eslint-disable-next-line max-len
    /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;

// Credit yup source code: https://github.com/jquense/yup/blob/master/src/string.ts
export const urlRegex =
    // eslint-disable-next-line
    /^((https?|ftp):)?\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;

// Currying because the message is passed from inside the validation hook
export const makeRegexValidator =
    (regex: RegExp) =>
    (
        message: string,
        name: string,
    ): {
        name: string;
        message: string;
        test: (value: string) => boolean;
    } => ({
        name,
        message,
        test: (value: string) => {
            if (!value) return true;
            const input = value.split(',');
            for (let i = 0; i < input.length; i += 1) {
                if (!input[i].trim().match(regex)) {
                    return false;
                }
            }
            return true;
        },
    });

// Same as built-in Boolean method, but works with arrays as well
export const BooleanValue = (value: Array<unknown> | unknown): boolean => {
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
};

// using a span is necessary to allow text styling
export const PlaceholderValue: ReactElement | Optional<Nullable<string>> = (
    <span>{textPlaceholder}</span>
);

/**
 *
 * Helper method to convert choices from OPTIONS request payload to dropdown options usable in Select component
 *
 * @param data  - Response from OPTIONS request
 * @param fields - Optional: selection of fields to be converted to dropdown list
 * @returns Array of dropdown options
 */
export const mapOptions = (
    data: OptionsResponse,
    fields?: string[],
): Record<string, DropdownOptions<string>[]> => {
    const result = {};
    if (!data) return result;
    // Convert object to 2 dimensional array
    Object.entries(data.actions.POST)
        // Only keep "choices" fields
        .filter(([, dict]) => dict.type === 'choice')
        // Format the choices as DropdownOptions
        .map(([key, dict]) => [
            key,
            dict.choices
                .map(choice => [
                    { label: choice.display_name, value: choice.value },
                ])
                .flat(),
        ])
        // Reconvert 2 dimensional array to object
        .forEach(([key, dict]) => {
            // Allow selection of fields to return
            if (!fields || fields?.includes(key as string)) {
                result[key as string] = dict;
            }
        });
    return result;
};
