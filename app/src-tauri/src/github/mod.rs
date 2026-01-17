//! GitHub OAuth authentication module
//!
//! Implements OAuth flow similar to GitHub Desktop with embedded credentials.

pub mod oauth;
pub mod api;
pub mod actions;
pub mod releases;
pub mod pages;
pub mod notifications;
pub mod insights;
pub mod pull_requests;
pub mod issues;
pub mod deployments;
pub mod environments;

pub use oauth::*;
pub use api::*;
