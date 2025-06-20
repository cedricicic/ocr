declare module 'tesseract.js' {
  export interface WorkerOptions {
    logger?: (m: any) => void;
    corePath?: string;
    workerPath?: string;
    langPath?: string;
    dataPath?: string;
    cachePath?: string;
    cacheMethod?: string;
    workerBlobURL?: boolean;
    gzip?: boolean;
  }

  export interface TesseractWorker {
    load(): Promise<TesseractWorker>;
    loadLanguage(langs: string): Promise<TesseractWorker>;
    initialize(langs: string): Promise<TesseractWorker>;
    setParameters(params: Partial<WorkerOptions>): Promise<TesseractWorker>;
    recognize(image: string | File | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<{
      data: {
        text: string;
        confidence: number;
        lines: any[];
        words: any[];
        symbols: any[];
      };
    }>;
    detect(image: string | File | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<any>;
    terminate(): Promise<void>;
  }

  export function createWorker(langs?: string | string[], oem?: number, options?: Partial<WorkerOptions>): Promise<TesseractWorker>;
  export function recognize(image: string | File | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement, langs?: string, options?: any): Promise<any>;
} 