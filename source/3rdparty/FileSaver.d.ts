interface FileSaver {
    (data: Blob, filename: string): void;
}
declare var saveAs: FileSaver;