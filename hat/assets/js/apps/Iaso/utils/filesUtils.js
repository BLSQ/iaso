const imgExtensions = ['jpg', 'JPG', 'png'];
const videoExtensions = ['mp4'];

export const getFileName = (path) => {
    const fullName = path.split('/').slice(-1)[0].split('.');
    return ({
        name: fullName[0],
        extension: fullName[1],
    });
};


export const sortFilesType = (files) => {
    const filesList = {
        images: [],
        videos: [],
        documents: {
            pdf: [],
            word: [],
            txt: [],
        },
        others: [],
    };
    files.forEach((f) => {
        const fileName = getFileName(f.path);
        if (imgExtensions.indexOf(fileName.extension) !== -1) {
            filesList.images.push(f);
        } else if (videoExtensions.indexOf(fileName.extension) !== -1) {
            filesList.videos.push(f);
        } else if (!filesList.documents[fileName.extension]) {
            filesList.others.push(f);
        } else {
            filesList.documents[fileName.extension].push(f);
        }
    });
    return (filesList);
};
