const engine = require('linkv_rtc_engine');
const WebGLRender = require('linkv_rtc_engine/render');
const fs = require("fs");

/** render.js */
const { app, BrowserWindow, crashReporter} = require("electron");

let result = engine.buildVersion();


const LinkVViewMode = {
    AspectFit: 0,
    AspectFill: 1,
    ScaleToFill: 2,
};


var go = false;

let button = document.getElementById("button");
let m3u8_p = document.getElementById("recorder_address");


button.onclick = function (event) {
  console.log(event);
  go = !go;
  if (go) {
    let taskId = "taskId" + new Date().getTime();
    engine.setAVConfig({onlyProfile:true, profile:5});
    engine.StartVVorkRecorder(taskId, 2);
  }
  else{
    engine.StopVVorkRecorder();
  }
}


let local_render = new WebGLRender();
let local_canvas = document.getElementById('local_view');
local_render.initGLfromCanvas(local_canvas);
local_render.setViewMode(LinkVViewMode.AspectFit);


let remoter_render = new WebGLRender();
let remoter_canvas = document.getElementById('remote_view');
remoter_render.initGLfromCanvas(remoter_canvas);
remoter_render.setViewMode(LinkVViewMode.AspectFit);

// let upload_s3 = new uploadS3();

engine.setISOCountryCode("CN");

// appId,  skStr, userId, callback, 0 为成功
engine.auth("5291372290", "f5e9cfc87f7d9c41e8b495419e315bc0", "yangyudong", function (code) {

 	console.log("auth result:" + code);

});

let remoteDir = "linkv/mac";
let localDir = "/Users/liveme/Desktop/electron_recorder/";
engine.setRecorderConfig(remoteDir, localDir, function (taskId, thumbnails, url) {
  // body...
  console.log(taskId, url);
  m3u8_p.innerHTML = "录制结果:" + url + "," + JSON.stringify(thumbnails);
});

console.log("sdkversion:" + result);
// 建议在鉴权成功之后再加入房间
// engine.loginRoom("H88000000003232123411", "L12323449384934438491", 1, 0);


engine.on("OnEnterRoomComplete", function (code, list) {
	console.log("join room code:" , code , "  list:" , list);
	engine.startPublishing();
});

engine.on("OnPublishStateUpdate", function (state) {
  console.log("OnPublishStateUpdate:" + state);
});

engine.on("OnRoomReconnected", function (code) {
  console.log("OnRoomReconnected: " + code);
});


engine.on("OnAddRemoter", function (member) {
    console.log(member);
    engine.startPlayingStream(member.userId);
});


engine.on("OnDeleteRemoter", function (member) {
    console.log(member);
});


engine.on("OnPublishQualityUpdate", function (quality) {
  console.log(quality);
});

engine.on("OnCaptureVideoFrame", function (frame, width, height) {
  local_render.drawVideoFrame(frame, width, height);
});

//引入内置fs模块
engine.on("OnDrawFrame", function (userId, frame, width, height) {
  remoter_render.drawVideoFrame(frame, width, height);
});

engine.on("OnPutToS3", function (url, header, file) {
  // upload_s3.uploadS3(url, header, file);
});

engine.on("OnCaptureScreenVideoFrame", function (frame, width, height) {
  local_render.drawVideoFrame(frame, width, height);
});


engine.InitCapture(1);

let info = engine.GetWindowsList();

let obj = info[1];
engine.StartScreenCapture(obj.id, 15);
console.log(info);









