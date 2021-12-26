const engine = require('linkv_rtc_engine');
const WebGLRender = require('linkv_rtc_engine/render');
const fs = require("fs");
let os = require("os");

/** render.js */
const { app, BrowserWindow, crashReporter} = require("electron");

let result = engine.buildVersion();
const LinkVViewMode = {
    AspectFit: 0,
    AspectFill: 1,
    ScaleToFill: 2,
};



let button = document.getElementById("button");
let m3u8_p = document.getElementById("recorder_address");
let upload_p = document.getElementById("upload_address");

engine.setAVConfig({fps:15, bitrate:3000, videoCaptureWidth:640, videoCaptureHeight:480, videoEncodeWidth:1280, videoEncodeHeight: 720});
button.onclick = function (event) {
  console.log(event);
  testRecorder();
  // testCameraCapture();
  // testSnapshotWindows();
}

var go = false;
function testRecorder(){
  go = !go;
  if (go) {
    let taskId = "taskId" + new Date().getTime();
    engine.setAVConfig({fps:15, bitrate:1800, min_bitrate:600, videoDegradationPreference:0, videoCaptureWidth:1280, videoCaptureHeight:720, videoEncodeWidth:1280, videoEncodeHeight:720});
    if (os.platform() != "darwin") {
      engine.startRecorderDevices();
    }
    engine.StartVVorkRecorder(taskId, "/vvork/1427466308800266240/video/", "/vvork/1427466308800266240/img/", 10,  2);
  }
  else{
    engine.StopVVorkRecorder();
  }
}

let local_render = new WebGLRender();
let local_canvas = document.getElementById('local_view');
local_render.initGLfromCanvas(local_canvas);
local_render.setViewMode(LinkVViewMode.AspectFill);
local_render.setMirrorEnable(false);

let remoter_render = new WebGLRender();
let remoter_canvas = document.getElementById('remote_view');
remoter_render.initGLfromCanvas(remoter_canvas);
remoter_render.setViewMode(LinkVViewMode.AspectFit);

engine.setISOCountryCode("CN");


let localDir = "E://work//linkv_rtc_electron//video/";
if (os.platform() === "darwin") {
  localDir = "/Users/badwin/Desktop/electron_recorder";
  engine.setRecorderConfig("https://api-qa.vvork.net/v1/utils/presign", "test14b9952af71e702519e7222f562d7535e9de", localDir, "yangyudong", function (taskId, thumbnails, url, duration, size, encode_width, encode_height) {
    // body...
    console.log(taskId, url, duration);
    m3u8_p.innerHTML = "录制结果:" + url + "," + JSON.stringify(thumbnails);
  });
}
else{
  engine.setRecorderConfig("http://lp-api-demo.linkv.fun/v1/utils/presign", "test14b9952af71e702519e7222f562d7535e9de", localDir, "yangyudong", 
    function (taskId, thumbnails, url, duration, size, encode_width, encode_height) {
      console.log(taskId, url, duration);
      m3u8_p.innerHTML = "录制结果:" + url + "," + JSON.stringify(thumbnails);
  });
  engine.setLogLevel(3)
}

console.log("sdkversion:" + result);

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

// engine.on("OnCaptureScreenVideoFrame", function (frame, width, height) {
//   local_render.drawVideoFrame(frame, width, height);
// });

function testCameraCapture(){
  let info = engine.GetVideoCaptureDevice();
  console.log(info);
  
  if (os.platform() === "darwin") {
    engine.initCameraCapture(info[0], "0", 1280, 720);
  }
  else{
    let info1 = engine.GetCameraResolution(info[0]);
    console.log(info1);
    let info2 = engine.GetCameraColorType(info1[17].width, info1[17].height);
    console.log(info2);
    engine.initCameraCapture(info[0], info2[1], 1280, 720);
  }
  
  engine.startCapture();
}

let enable = true;
let beautyLevel = 50;
let brightLevel = 50;
let toneLevel = 50;

engine.SetBeautyParameter(enable, beautyLevel, brightLevel, toneLevel)

function testSnapshotWindows(){
  engine.InitCapture2(1, 1280, 720, {x:0,y:0, width:0, height:0});
  let winList = engine.GetWindowsList();
  console.log(winList);

  engine.StartScreenCapture(winList[0].id, 15);
}



let list = engine.GetAudioCaptureDevice();
testCameraCapture();
testSnapshotWindows();
console.log(list);




