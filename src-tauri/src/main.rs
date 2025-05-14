// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use serde::{Serialize, Deserialize};
use tauri::{Manager};
use reqwest;
use chrono::prelude::Local;

#[derive(Serialize, Deserialize, Debug)]
pub struct Config {
    hosts: Vec<String>,
    interval: u64,
    cityId: String
}

#[tauri::command]
fn get_config() -> String {
    let conf: Config = get_configjson();

    format!("{}", serde_json::to_string(&conf).unwrap())
}

#[tauri::command]
async fn get_body(url: String) -> String {
    let res = fetch(url).await;

    format!("{}", res)
}

#[tauri::command]
async fn get_cameraview(url: String) -> String {
    let res = fetch_img(url).await;

    format!("{}", res)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_config, get_body, get_cameraview])
        .setup(|app| {
            let conf: Config = get_configjson();
            let app_handle = app.app_handle();
            //let holiday = get_body(format!("https://holidays-jp.github.io/api/v1/{}/data.json", year));
            //app_handle.emit_all("holiday", holiday).unwrap();
            //std::thread::spawn(move || loop {
            //    let img = get_cameraview(conf.hosts[0].clone()).await;
            //    app_handle.emit_all("cameraview", img).unwrap();
            //    std::thread::sleep(std::time::Duration::from_millis(conf.interval));
            //});
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn get_configjson() -> Config {
    let file = fs::read_to_string("config.json");
    let mut res = Config {
        hosts: vec![],
        interval: 500,
        cityId: "".to_string()
    };

    match file {
        Ok(val) => {
            let tmp: Config = serde_json::from_str(&val).unwrap();
            res.hosts = tmp.hosts;
            res.interval = tmp.interval;
            res.cityId = tmp.cityId;
        },
        Err(_) => {},
    }

    return res;
}

async fn fetch(url: String) -> String {
    let response = reqwest::get(url).await.unwrap();
    let body = response.text().await.unwrap();

    return body.to_string();
}

async fn fetch_img(url: String) -> String {
    let res = reqwest::get(url).await.unwrap();
    let body = res.bytes().await.unwrap();

    return base64::encode(body).to_string();
}