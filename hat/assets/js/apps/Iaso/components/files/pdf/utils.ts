import { Accept } from 'react-dropzone';

export const acceptPDF: Accept = {
    'application/pdf': ['.pdf'],
};

export const processErrorDocsBase = <T>(err_docs?: T | T[] | null): T[] => {
    if (!err_docs) return [];
    if (!Array.isArray(err_docs)) return [err_docs];
    return err_docs;
};
