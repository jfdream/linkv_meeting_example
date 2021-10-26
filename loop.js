const engine = require('linkv_rtc_engine');
const WebGLRender = require('linkv_rtc_engine/render');
const fs = require("fs");
let os = require("os");

/** render.js */
const { app, BrowserWindow, crashReporter} = require("electron");

let result = engine.buildVersion();

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

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

    engine.setAVConfig({fps:15, bitrate:1800, min_bitrate:600, videoDegradationPreference:0, videoCaptureWidth:1280, videoCaptureHeight:720, videoEncodeWidth:1280, videoEncodeHeight:720});

    engine.startRecorder(taskId, "/vvork/1427466308800266240/video/", "/vvork/1427466308800266240/img/", 8,  2);
  }
  else{
    engine.stopRecorder();
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

engine.setISOCountryCode("CN");

// appId,  skStr, userId, callback, 0 为成功
// engine.auth("5291372290", "f5e9cfc87f7d9c41e8b495419e315bc0", "yangyudong", function (code) {

//  	console.log("auth result:" + code);
// });

if (os.platform() === "win32") { 
  let localDir = "E://work//linkv_rtc_electron//video/";
  engine.setRecorderConfig("http://lp-api-demo.linkv.fun/v1/utils/presign", "yangzg123456", localDir, 
  function (taskId, thumbnails, url) {
    console.log(taskId, url);
    m3u8_p.innerHTML = "录制结果:" + url + "," + JSON.stringify(thumbnails);
  });
} else {
  let localDir = "/Users/liveme/Desktop/electron_recorder";
  engine.setRecorderConfig("https://lp-api-demo.linkv.fun/v1/utils/presign", "1451629eeedc0c37e750403122b78028f47b5a35", localDir, function (taskId, thumbnails, url, duration) {
    // body...
    console.log(taskId, url, duration);
    m3u8_p.innerHTML = "录制结果:" + url + "," + JSON.stringify(thumbnails);
  });
}


// engine.auth("5291372290", "f5e9cfc87f7d9c41e8b495419e315bc0", "yangzg", function (code) {
//  	console.log("auth result:" + code);
// });

// let localDir = "E://work//linkv_rtc_electron//video/";
// engine.setRecorderConfig("http://api-hk.vvork.net/v1/utils/presign", "1494778d3eb967e51ac888e12b1e2ecccd44011b", localDir, 
//   function (taskId, thumbnails, url, duration) {
//   console.log(taskId, url, duration);
//   m3u8_p.innerHTML = "录制结果:" + url + "," + JSON.stringify(thumbnails);
// });

console.log("sdkversion:" + result);
// 建议在鉴权成功之后再加入房间
//engine.loginRoom("H88000000003232123411", "L12323449384934438491", 1, 0);


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

engine.on("OnDrawFrame", function (userId, frame, width, height) {
  remoter_render.drawVideoFrame(frame, width, height);
});

engine.on("OnCaptureScreenVideoFrame", function (frame, width, height) {
  local_render.drawVideoFrame(frame, width, height);
});


<<<<<<< HEAD
// engine.InitCapture(1);

// let info = engine.GetWindowsList();
=======
/*
engine.InitCapture(1);
//engine.InitCapture(2, 1920,1080, {x:0, y:10, width:100, height:100});
>>>>>>> 78485903cf52886b7b1de882b076928d3e32f642

// console.log("============>",info);

<<<<<<< HEAD
// engine.StartScreenCapture(info[1].id, 15);


// engine.initCameraCapture("Logitech HD Webcam C270", "I420", 1280, 720);

engine.startCapture();

=======
engine.StartScreenCapture(info[1].id, 15);
*/


//JPEG

let info = engine.GetVideoCaptureDevice();
console.log(info);

let info1 = engine.GetCameraResolution(info[0]);
console.log(info1);

let info2 = engine.GetCameraColorType(info1[2].width, info1[2].height);
console.log(info2);

//engine.initCameraCapture("Logitech HD Webcam C270", "I420", 1280, 720);

engine.initCameraCapture(info[0], info2[0], info1[2].width, info1[2].height);

engine.startCapture();
>>>>>>> 78485903cf52886b7b1de882b076928d3e32f642



//YUV
/*
let info = engine.GetVideoCaptureDevice();
console.log(info);

let info1 = engine.GetCameraResolution(info[0]);
console.log(info1);

let info2 = engine.GetCameraColorType(info1[17].width, info1[17].height);
console.log(info2);

engine.initCameraCapture(info[0], info2[0], info1[17].width, info1[17].height);

engine.startCapture();
*/




