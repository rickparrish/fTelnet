interface ClipboardData {
    getData: (format: string) => string;    
    setData: (format: string, data: string) => void;
}

