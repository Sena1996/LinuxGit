use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct GitUserConfig {
    pub name: Option<String>,
    pub email: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SshKeyInfo {
    pub key_type: String,
    pub path: String,
    pub exists: bool,
}

#[tauri::command]
pub fn get_git_config() -> Result<GitUserConfig, String> {
    let config = git2::Config::open_default().map_err(|e| e.to_string())?;
    let name = config.get_string("user.name").ok();
    let email = config.get_string("user.email").ok();
    Ok(GitUserConfig { name, email })
}

#[tauri::command]
pub fn set_git_config(name: Option<String>, email: Option<String>) -> Result<(), String> {
    let mut config = git2::Config::open_default().map_err(|e| e.to_string())?;

    if let Some(n) = name {
        if !n.is_empty() {
            config.set_str("user.name", &n).map_err(|e| e.to_string())?;
        }
    }

    if let Some(e) = email {
        if !e.is_empty() {
            config.set_str("user.email", &e).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

#[tauri::command]
pub fn get_ssh_keys() -> Result<Vec<SshKeyInfo>, String> {
    let home = std::env::var("HOME").unwrap_or_default();
    let ssh_dir = format!("{}/.ssh", home);

    let key_types = vec![
        ("Ed25519", "id_ed25519"),
        ("RSA", "id_rsa"),
        ("ECDSA", "id_ecdsa"),
        ("DSA", "id_dsa"),
    ];

    let keys = key_types
        .into_iter()
        .map(|(key_type, filename)| {
            let path = format!("{}/{}", ssh_dir, filename);
            let pub_path = format!("{}.pub", path);
            let exists = std::path::Path::new(&pub_path).exists();
            SshKeyInfo {
                key_type: key_type.to_string(),
                path: pub_path,
                exists,
            }
        })
        .collect();

    Ok(keys)
}
