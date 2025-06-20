// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

use screenshots::Screen;
use screenshots::image::GenericImageView;
use tauri::{AppHandle, Emitter, Listener};

#[derive(Debug, Serialize, Deserialize)]
pub struct OcrResult {
    pub id: String,
    pub text: String,
    pub timestamp: DateTime<Utc>,
    pub screenshot_path: String,
    pub confidence: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AppSettings {
    pub global_hotkey: String,
    pub auto_copy_to_clipboard: bool,
    pub save_screenshots: bool,
    pub screenshots_dir: String,
    pub autostart: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CaptureRegion {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            global_hotkey: "ctrl+shift+o".to_string(),
            auto_copy_to_clipboard: true,
            save_screenshots: true,
            screenshots_dir: get_default_screenshots_dir(),
            autostart: false,
        }
    }
}

fn get_default_screenshots_dir() -> String {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("InstantText OCR")
        .join("Screenshots")
        .to_string_lossy()
        .to_string()
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to InstantText OCR!", name)
}

#[tauri::command]
async fn start_region_capture(app: AppHandle) -> Result<(), String> {
    // Emit event to frontend to start region selection
    app.emit("start-region-capture", {}).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn capture_screenshot_region(region: Option<CaptureRegion>) -> Result<String, String> {
    let screens = Screen::all().map_err(|e| format!("Failed to get screens: {}", e))?;
    
    if screens.is_empty() {
        return Err("No screens found".to_string());
    }

    // Use the primary screen for now
    let screen = &screens[0];
    let image = screen.capture().map_err(|e| format!("Failed to capture screen: {}", e))?;
    
    // Crop the image if a region is specified
    let final_image = if let Some(region) = region {
        let width = image.width();
        let height = image.height();
        
        // Ensure region is within bounds
        let x = region.x.max(0) as u32;
        let y = region.y.max(0) as u32;
        let crop_width = region.width.min(width.saturating_sub(x));
        let crop_height = region.height.min(height.saturating_sub(y));
        
        if crop_width == 0 || crop_height == 0 {
            return Err("Invalid capture region".to_string());
        }
        
        image.view(x, y, crop_width, crop_height).to_image()
    } else {
        image
    };
    
    // Save the screenshot
    let data_dir = get_app_data_dir()?;
    let screenshots_dir = data_dir.join("screenshots");
    fs::create_dir_all(&screenshots_dir)
        .map_err(|e| format!("Failed to create screenshots directory: {}", e))?;
    
    let timestamp = Utc::now();
    let filename = format!("screenshot_{}.png", timestamp.format("%Y%m%d_%H%M%S"));
    let filepath = screenshots_dir.join(&filename);
    
    final_image.save(&filepath)
        .map_err(|e| format!("Failed to save screenshot: {}", e))?;
    
    Ok(filepath.to_string_lossy().to_string())
}

#[tauri::command]
async fn save_ocr_result(result: OcrResult) -> Result<(), String> {
    let data_dir = get_app_data_dir()?;
    let results_file = data_dir.join("ocr_results.json");
    
    // Load existing results
    let mut results: Vec<OcrResult> = if results_file.exists() {
        let content = fs::read_to_string(&results_file)
            .map_err(|e| format!("Failed to read results file: {}", e))?;
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        Vec::new()
    };
    
    // Add new result
    results.push(result);
    
    // Save back to file
    let json = serde_json::to_string_pretty(&results)
        .map_err(|e| format!("Failed to serialize results: {}", e))?;
    
    fs::write(&results_file, json)
        .map_err(|e| format!("Failed to write results file: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn get_ocr_history() -> Result<Vec<OcrResult>, String> {
    let data_dir = get_app_data_dir()?;
    let results_file = data_dir.join("ocr_results.json");
    
    if !results_file.exists() {
        return Ok(Vec::new());
    }
    
    let content = fs::read_to_string(&results_file)
        .map_err(|e| format!("Failed to read results file: {}", e))?;
    
    let results: Vec<OcrResult> = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse results file: {}", e))?;
    
    Ok(results)
}

#[tauri::command]
async fn get_settings() -> Result<AppSettings, String> {
    let data_dir = get_app_data_dir()?;
    let settings_file = data_dir.join("settings.json");
    
    if !settings_file.exists() {
        return Ok(AppSettings::default());
    }
    
    let content = fs::read_to_string(&settings_file)
        .map_err(|e| format!("Failed to read settings file: {}", e))?;
    
    let settings: AppSettings = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse settings file: {}", e))?;
    
    Ok(settings)
}

#[tauri::command]
async fn save_settings(settings: AppSettings) -> Result<(), String> {
    let data_dir = get_app_data_dir()?;
    let settings_file = data_dir.join("settings.json");
    
    let json = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    
    fs::write(&settings_file, json)
        .map_err(|e| format!("Failed to write settings file: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn ensure_directories() -> Result<(), String> {
    let data_dir = get_app_data_dir()?;
    fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Failed to create data directory: {}", e))?;
    
    let screenshots_dir = data_dir.join("screenshots");
    fs::create_dir_all(&screenshots_dir)
        .map_err(|e| format!("Failed to create screenshots directory: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn register_global_hotkey(app: AppHandle, hotkey: String) -> Result<(), String> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
    
    // First unregister any existing hotkey
    let _ = app.global_shortcut().unregister_all();
    
    // Parse the hotkey string into a Shortcut
    let shortcut: Shortcut = hotkey.parse()
        .map_err(|e| format!("Failed to parse hotkey '{}': {}", hotkey, e))?;
    
    // Register the new hotkey
    app.global_shortcut()
        .register(shortcut)
        .map_err(|e| format!("Failed to register hotkey: {}", e))?;
    
    Ok(())
}

fn get_app_data_dir() -> Result<PathBuf, String> {
    dirs::home_dir()
        .ok_or("Failed to get home directory")?
        .join("InstantText OCR")
        .pipe(Ok)
}

trait PipeExt<T> {
    fn pipe<U, F: FnOnce(T) -> U>(self, f: F) -> U;
}

impl<T> PipeExt<T> for T {
    fn pipe<U, F: FnOnce(T) -> U>(self, f: F) -> U {
        f(self)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            start_region_capture,
            capture_screenshot_region,
            save_ocr_result,
            get_ocr_history,
            get_settings,
            save_settings,
            ensure_directories,
            register_global_hotkey
        ])
        .setup(|app| {
            let app_handle = app.handle().clone();
            
            // Set up global shortcut event listener
            let app_handle_for_listener = app_handle.clone();
            app.listen("shortcut", move |_event| {
                let _ = app_handle_for_listener.emit("hotkey-pressed", {});
            });
            
            // Initialize app directories on startup
            tauri::async_runtime::spawn(async move {
                if let Err(e) = ensure_directories().await {
                    eprintln!("Failed to initialize directories: {}", e);
                }
                
                // Register default global hotkey
                if let Err(e) = register_global_hotkey(app_handle, "ctrl+shift+o".to_string()).await {
                    eprintln!("Failed to register global hotkey: {}", e);
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
