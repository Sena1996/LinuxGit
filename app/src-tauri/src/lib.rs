pub mod commands;
pub mod git;
pub mod ai;

use commands::{AppState, *};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt::init();

    tauri::Builder::default()
        .manage(AppState::default())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // Repository commands
            open_repository,
            init_repository,
            get_repository_info,
            // Status commands
            get_status,
            stage_files,
            unstage_files,
            discard_changes,
            // Commit commands
            create_commit,
            get_commits,
            get_commit_detail,
            cherry_pick_commit,
            revert_commit,
            reset_to_commit,
            checkout_commit,
            create_tag,
            get_commit_diff,
            // Branch commands
            get_branches,
            create_branch,
            checkout_branch,
            delete_branch,
            merge_branch,
            // Diff commands
            get_file_diff,
            // AI commands
            generate_commit_message,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
