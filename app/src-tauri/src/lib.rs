pub mod commands;
pub mod error;
pub mod git;
pub mod ai;
pub mod github;

use commands::{AppState, *};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt::init();

    tauri::Builder::default()
        .manage(AppState::default())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Set window icon (embedded at compile time)
            if let Some(window) = app.get_webview_window("main") {
                let icon_bytes = include_bytes!("../icons/icon.png");
                println!("Icon bytes length: {}", icon_bytes.len());
                match image::load_from_memory(icon_bytes) {
                    Ok(img) => {
                        let rgba = img.to_rgba8();
                        let (width, height) = rgba.dimensions();
                        println!("Icon loaded: {}x{}", width, height);
                        let icon = tauri::image::Image::new_owned(
                            rgba.into_raw(),
                            width,
                            height,
                        );
                        match window.set_icon(icon) {
                            Ok(_) => println!("Icon set successfully!"),
                            Err(e) => println!("Failed to set icon: {:?}", e),
                        }
                    }
                    Err(e) => println!("Failed to load icon: {:?}", e),
                }
            } else {
                println!("No main window found!");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Repository commands
            open_repository,
            init_repository,
            get_repository_info,
            // Git config commands
            get_git_config,
            set_git_config,
            get_ssh_keys,
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
            // New commit operations
            merge_commit,
            rebase_onto,
            interactive_rebase,
            delete_tag,
            squash_commits,
            amend_commit_message,
            drop_commit,
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
            get_ai_config,
            set_ai_config,
            check_ollama_status,
            validate_openai_key,
            list_ollama_models,
            // Remote commands
            get_remotes,
            add_remote,
            remove_remote,
            fetch_remote,
            fetch_all_remotes,
            pull_remote,
            push_remote,
            // Clone & Repository Management commands
            clone_repository,
            scan_for_repos,
            get_repo_sync_status,
            // Workflow file commands
            list_repository_files,
            list_workflow_files,
            create_workflow_file,
            read_workflow_file,
            delete_workflow_file,
            // GitHub Authentication commands
            github_login,
            github_auth_status,
            github_logout,
            github_get_user,
            github_get_repos,
            github_get_token,
            // GitHub Actions commands
            github_list_workflows,
            github_list_workflow_runs,
            github_get_workflow_run,
            github_get_workflow_run_jobs,
            github_get_workflow_run_logs,
            github_trigger_workflow,
            github_cancel_workflow_run,
            github_rerun_workflow,
            github_rerun_failed_jobs,
            github_list_run_artifacts,
            github_list_repo_artifacts,
            github_get_artifact_download_url,
            github_delete_artifact,
            github_delete_workflow_run,
            // GitHub Releases commands
            github_list_releases,
            github_get_release,
            github_get_latest_release,
            github_get_release_by_tag,
            github_create_release,
            github_update_release,
            github_delete_release,
            github_generate_release_notes,
            github_list_release_assets,
            github_delete_release_asset,
            github_list_tags,
            // GitHub Pages commands
            github_get_pages_info,
            github_enable_pages,
            github_update_pages,
            github_disable_pages,
            github_list_pages_builds,
            github_get_latest_pages_build,
            github_request_pages_build,
            github_get_deployment_status,
            // GitHub Notifications commands
            github_list_notifications,
            github_list_repo_notifications,
            github_mark_all_notifications_read,
            github_mark_repo_notifications_read,
            github_get_thread,
            github_mark_thread_read,
            github_mark_thread_done,
            github_get_thread_subscription,
            github_set_thread_subscription,
            github_delete_thread_subscription,
            github_get_unread_count,
            // GitHub Insights commands
            github_get_contributors,
            github_get_commit_activity,
            github_get_code_frequency,
            github_get_participation,
            github_get_punch_card,
            github_get_traffic_views,
            github_get_traffic_clones,
            github_get_top_referrers,
            github_get_popular_paths,
            github_get_community_profile,
            github_get_languages,
            // GitHub Pull Requests commands
            github_list_pull_requests,
            github_get_pull_request,
            github_create_pull_request,
            github_update_pull_request,
            github_merge_pull_request,
            github_list_pr_reviews,
            github_list_pr_comments,
            github_request_reviewers,
            github_create_review,
            // GitHub Issues commands
            github_list_issues,
            github_get_issue,
            github_create_issue,
            github_update_issue,
            github_list_issue_comments,
            github_create_issue_comment,
            github_list_labels,
            github_list_milestones,
            github_add_labels_to_issue,
            github_lock_issue,
            github_unlock_issue,
            // GitHub Deployments commands
            github_list_deployments,
            github_get_deployment,
            github_create_deployment,
            github_delete_deployment,
            github_list_deployment_statuses,
            github_create_deployment_status,
            github_get_deployment_summary,
            // GitHub Environments commands
            github_list_environments,
            github_get_environment,
            github_create_environment,
            github_update_environment,
            github_delete_environment,
            github_list_environment_secrets,
            github_list_environment_variables,
            github_list_branch_policies,
            github_create_branch_policy,
            github_delete_branch_policy,
            // GitHub Security commands
            github_list_dependabot_alerts,
            github_list_code_scanning_alerts,
            github_list_secret_scanning_alerts,
            github_dismiss_dependabot_alert,
            github_dismiss_code_scanning_alert,
            github_resolve_secret_scanning_alert,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
