import { ShortFile } from '../domains/instances/types/instance';

const imgExtensions: string[] = ['jpg', 'jpeg', 'JPG', 'png'];
const videoExtensions: string[] = ['mp4'];
const documentExtensions: string[] = [
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'csv',
    'txt',
];

export type FileName = {
    name: string;
    extension: string;
};

export const getFileName = (path: string): FileName => {
    let tempPath = path;
    if (tempPath.includes('?')) {
        [tempPath] = tempPath.split('?').slice(0);
    }
    let fullFileName = '';
    const fullFileNameArray = tempPath.split('/').slice(-1);
    if (fullFileNameArray && fullFileNameArray.length > 0) {
        [fullFileName] = fullFileNameArray;
    }
    const extensionsArray = fullFileName.match(/\.[0-9a-z]+$/i);
    let extension = '';
    if (extensionsArray) {
        [extension] = extensionsArray;
    }
    const name = fullFileName.replace(extension, '');
    return {
        name,
        extension: extension.replace('.', ''),
    };
};

export type SortedFiles = {
    images: ShortFile[];
    videos: ShortFile[];
    docs: ShortFile[];
    others: ShortFile[];
};

export const sortFilesType = (files: ShortFile[]): SortedFiles => {
    const filesList: SortedFiles = {
        images: [],
        videos: [],
        docs: [],
        others: [],
    };
    files.forEach(f => {
        const fileName = getFileName(f.path);
        const fullFile: ShortFile = {
            ...f,
            ...fileName,
        };
        if (imgExtensions.includes(fileName.extension)) {
            filesList.images.push(fullFile);
        } else if (videoExtensions.includes(fileName.extension)) {
            filesList.videos.push(fullFile);
        } else if (documentExtensions.includes(fileName.extension)) {
            filesList.docs.push(fullFile);
        } else {
            filesList.others.push(fullFile);
        }
    });
    return filesList;
};
