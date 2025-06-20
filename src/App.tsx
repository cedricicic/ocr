import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { 
  Camera, 
  Settings, 
  History, 
  Copy,
  Square
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import './App.css';

// Types
interface OcrResult {
  id: string;
  text: string;
  timestamp: string;
  screenshot_path: string;
  confidence: number;
}

interface AppSettings {
  global_hotkey: string;
  auto_copy_to_clipboard: boolean;
  save_screenshots: boolean;
  screenshots_dir: string;
  autostart: boolean;
}

interface CaptureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

// OCR Worker hook
const useOcrWorker = () => {
  const [worker, setWorker] = useState<import('tesseract.js').TesseractWorker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initWorker = async () => {
      try {
        console.log('Initializing Tesseract worker...');
        const tesseractWorker = await createWorker('eng');
        console.log('Tesseract worker initialized successfully');
        setWorker(tesseractWorker);
        setInitError(null);
      } catch (error) {
        console.error('Failed to initialize Tesseract worker:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error');
      }
    };
    
    initWorker();
    
    return () => {
      if (worker) {
        console.log('Terminating Tesseract worker...');
        worker.terminate();
      }
    };
  }, []);

  const performOcr = useCallback(async (imageData: string) => {
    if (!worker) throw new Error('OCR worker not initialized');
    
    setIsLoading(true);
    try {
      console.log('Performing OCR on image...');
      const { data: { text, confidence } } = await worker.recognize(imageData);
      console.log('OCR completed:', { text: text.substring(0, 50), confidence });
      return { text: text.trim(), confidence };
    } catch (error) {
      console.error('OCR failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [worker]);

  return { performOcr, isLoading, isReady: !!worker && !initError, initError };
};

// Main App Component
function App() {
  const [currentView, setCurrentView] = useState<'capture' | 'history' | 'settings'>('capture');
  const [ocrResults, setOcrResults] = useState<OcrResult[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    global_hotkey: 'ctrl+shift+o',
    auto_copy_to_clipboard: true,
    save_screenshots: true,
    screenshots_dir: '',
    autostart: false,
  });
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastResult, setLastResult] = useState<OcrResult | null>(null);
  const [isSelectingRegion, setIsSelectingRegion] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<CaptureRegion | null>(null);

  const { performOcr, isLoading: isOcrProcessing, isReady: isOcrReady, initError } = useOcrWorker();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [historyResults, appSettings] = await Promise.all([
          invoke<OcrResult[]>('get_ocr_history'),
          invoke<AppSettings>('get_settings'),
        ]);
        
        setOcrResults(historyResults);
        setSettings(appSettings);
        
        // Register global hotkey
        if (appSettings.global_hotkey) {
          await invoke('register_global_hotkey', { hotkey: appSettings.global_hotkey });
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, []);

  // Listen for global hotkey events
  useEffect(() => {
    const unlistenHotkey = listen('hotkey-pressed', () => {
      handleStartCapture();
    });

    const unlistenRegionCapture = listen('start-region-capture', () => {
      setIsSelectingRegion(true);
    });

    return () => {
      unlistenHotkey.then(fn => fn());
      unlistenRegionCapture.then(fn => fn());
    };
  }, []);

  // Start region capture process
  const handleStartCapture = async () => {
    if (!isOcrReady) {
      alert('OCR system is still initializing. Please wait a moment.');
      return;
    }
    
    try {
      await invoke('start_region_capture');
    } catch (error) {
      console.error('Failed to start region capture:', error);
    }
  };

  // Handle full screenshot capture from button click
  const handleFullScreenCapture = async () => {
    await handleCapture();
  };

  // Handle screenshot capture and OCR with actual implementation
  const handleCapture = async (region?: CaptureRegion) => {
    if (!isOcrReady) {
      alert('OCR system is still initializing. Please wait a moment.');
      return;
    }

    setIsCapturing(true);
    setIsSelectingRegion(false);
    
    try {
      // Capture screenshot using the new backend function
      const screenshotPath = await invoke<string>('capture_screenshot_region', { region });
      
      // Load the captured image for OCR
      // Convert file path to data URL for Tesseract
      const response = await fetch(`file://${screenshotPath}`);
      const blob = await response.blob();
      const imageData = URL.createObjectURL(blob);
      
      // Perform OCR on the captured image
      const { text, confidence } = await performOcr(imageData);
      
      // Create OCR result
      const result: OcrResult = {
        id: Date.now().toString(),
        text: text || 'No text detected',
        timestamp: new Date().toISOString(),
        screenshot_path: screenshotPath,
        confidence: confidence || 0,
      };

      // Save result
      await invoke('save_ocr_result', { result });
      
      // Update state
      setOcrResults(prev => [result, ...prev]);
      setLastResult(result);

      // Auto-copy to clipboard if enabled
      if (settings.auto_copy_to_clipboard && result.text) {
        await writeText(result.text);
      }

      // Clean up object URL
      URL.revokeObjectURL(imageData);

    } catch (error) {
      console.error('Capture failed:', error);
      alert(`Failed to capture and process screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCapturing(false);
      setSelectedRegion(null);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Save settings
  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await invoke('save_settings', { settings: newSettings });
      setSettings(newSettings);
      
      // Re-register global hotkey if it changed
      if (newSettings.global_hotkey !== settings.global_hotkey) {
        await invoke('register_global_hotkey', { hotkey: newSettings.global_hotkey });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // Render different views
  const renderCaptureView = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">InstantText OCR</h1>
        <p className="text-gray-600 max-w-md">
          Capture any screen region and instantly extract all text with advanced OCR technology.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="space-y-3">
          <button
            onClick={handleStartCapture}
            disabled={isCapturing || isOcrProcessing || !isOcrReady}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
              isCapturing || isOcrProcessing || !isOcrReady
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 active:scale-95'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {isCapturing || isOcrProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{isCapturing ? 'Capturing...' : 'Processing...'}</span>
                </>
              ) : (
                <>
                  <Square className="w-5 h-5" />
                  <span>Select Region & Extract Text</span>
                </>
              )}
            </div>
          </button>

          <button
            onClick={handleFullScreenCapture}
            disabled={isCapturing || isOcrProcessing || !isOcrReady}
            className={`w-full py-3 px-6 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 ${
              isCapturing || isOcrProcessing || !isOcrReady
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Camera className="w-4 h-4" />
              <span>Capture Full Screen</span>
            </div>
          </button>
        </div>

        {!isOcrReady && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            {initError ? `OCR Error: ${initError}` : 'Initializing OCR engine...'}
          </p>
        )}

        <div className="mt-4 text-sm text-gray-500 text-center">
          Hotkey: <kbd className="bg-gray-100 px-2 py-1 rounded">{settings.global_hotkey}</kbd>
        </div>
      </div>

      {lastResult && (
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 max-w-2xl w-full fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Latest Result</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(lastResult.text)}
                className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-800 whitespace-pre-wrap">{lastResult.text || 'No text detected'}</p>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Confidence: {Math.round(lastResult.confidence)}%
          </div>
        </div>
      )}

      {/* Region Selection Instructions */}
      {isSelectingRegion && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-2xl w-full">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Region Selection Active</h3>
          <p className="text-blue-700 mb-4">
            The application has initiated screen capture. Use your system's screenshot tool to select a region, 
            or click "Capture Full Screen" below to capture the entire screen.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={handleFullScreenCapture}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Capture Full Screen
            </button>
            <button
              onClick={() => setIsSelectingRegion(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderHistoryView = () => (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">OCR History</h2>
        
        {ocrResults.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No OCR results yet. Start by capturing a screenshot!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ocrResults.map((result) => (
              <div key={result.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-500">
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(result.text)}
                      className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {result.text || 'No text detected'}
                  </p>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Confidence: {Math.round(result.confidence)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSettingsView = () => (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Global Hotkey
            </label>
            <input
              type="text"
              value={settings.global_hotkey}
              onChange={(e) => setSettings(prev => ({ ...prev, global_hotkey: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., ctrl+shift+o"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Auto-copy to clipboard</h3>
              <p className="text-sm text-gray-500">Automatically copy extracted text</p>
            </div>
            <input
              type="checkbox"
              checked={settings.auto_copy_to_clipboard}
              onChange={(e) => setSettings(prev => ({ ...prev, auto_copy_to_clipboard: e.target.checked }))}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Save screenshots</h3>
              <p className="text-sm text-gray-500">Keep a local copy of captured images</p>
            </div>
            <input
              type="checkbox"
              checked={settings.save_screenshots}
              onChange={(e) => setSettings(prev => ({ ...prev, save_screenshots: e.target.checked }))}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Start on boot</h3>
              <p className="text-sm text-gray-500">Launch app automatically when system starts</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autostart}
              onChange={(e) => setSettings(prev => ({ ...prev, autostart: e.target.checked }))}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>

          <button
            onClick={() => saveSettings(settings)}
            className="w-full py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Camera className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-semibold text-gray-800">InstantText OCR</span>
            </div>
            
            <div className="flex space-x-1">
              <button
                onClick={() => setCurrentView('capture')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'capture'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Camera className="w-4 h-4 inline mr-2" />
                Capture
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'history'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <History className="w-4 h-4 inline mr-2" />
                History
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'settings'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {currentView === 'capture' && renderCaptureView()}
        {currentView === 'history' && renderHistoryView()}
        {currentView === 'settings' && renderSettingsView()}
      </main>
    </div>
  );
}

export default App;
