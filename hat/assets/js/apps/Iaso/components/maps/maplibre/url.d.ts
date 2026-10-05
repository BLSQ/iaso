/** `import url from '<file>?url'`: the url of the file, emitted by webpack as an asset */
declare module '*?url' {
    const url: string;
    export default url;
}
