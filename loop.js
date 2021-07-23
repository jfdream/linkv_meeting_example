const engine = require('linkv_rtc_engine');
const WebGLRender = require('linkv_rtc_engine/render');
const fs = require("fs");
let os = require("os");

/** render.js */
const { app, BrowserWindow, crashReporter} = require("electron");

const HTTP = require('./http');

let result = engine.buildVersion();


const LinkVViewMode = {
    AspectFit: 0,
    AspectFill: 1,
    ScaleToFill: 2,
};


let http = new HTTP();

var go = false;

let button = document.getElementById("button");
let m3u8_p = document.getElementById("recorder_address");


button.onclick = function (event) {
  console.log(event);
  go = !go;
  if (go) {
    let taskId = "taskId" + new Date().getTime();
    if (os.platform() === "win32") { 
    engine.setAVConfig({fps:15, bitrate:1800, min_bitrate:600, videoDegradationPreference:0, videoCaptureWidth:1280, videoCaptureHeight:720, videoEncodeWidth:1280, videoEncodeHeight:720});
//    engine.setAVConfig(15, 1800, 600, 0, 1280, 720, 1280, 720);
    } else {
         engine.setAVConfig({onlyProfile:true, profile:5}); 
    }
    engine.StartVVorkRecorder(taskId, "linkv/video", "linkv/image", 10, 2);
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

engine.setISOCountryCode("CN");

// appId,  skStr, userId, callback, 0 为成功
engine.auth("5291372290", "f5e9cfc87f7d9c41e8b495419e315bc0", "yangyudong", function (code) {

 	console.log("auth result:" + code);
});

engine.setUploadCallback(
  function (url, file, header) {
      console.log(url, file);
      upload_p.innerHTML = "上传:" + url + "," + JSON.stringify(header);
  });

if (os.platform() === "win32") { 
  let localDir = "E://work//linkv_rtc_electron//video/";
  engine.setRecorderConfig("http://lp-api-demo.linkv.fun/v1/utils/presign", "yangzg123456", localDir, 
  function (taskId, thumbnails, url) {
    console.log(taskId, url);
    m3u8_p.innerHTML = "录制结果:" + url + "," + JSON.stringify(thumbnails);
  });
} else {
  let localDir = "/Users/liveme/Desktop/electron_recorder/";
  engine.setRecorderConfig("https://lp-api-demo.linkv.fun/v1/utils/presign", "yangyudong", localDir, function (taskId, thumbnails, url) {
    // body...
    console.log(taskId, url);
    m3u8_p.innerHTML = "录制结果:" + url + "," + JSON.stringify(thumbnails);
  });
}


console.log("sdkversion:" + result);
// 建议在鉴权成功之后再加入房间
if (os.platform() === "win32") 
  engine.loginRoom("H88000000003232123411", "L12323449384934438491", 1, 0);


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

engine.on("OnPutToS3", function (url, filePath, header) {
    fs.readFile(filePath, (err, byte) => {
        let file = byte;
        http.PUT(url, header, file).then(function (okSp) {
            console.log("上传成功");
        });
    });
});

engine.on("OnCaptureScreenVideoFrame", function (frame, width, height) {
  local_render.drawVideoFrame(frame, width, height);
});


engine.InitCapture(1);

let info = engine.GetWindowsList();

engine.StartScreenCapture(info[1].id, 15);

/*
engine.initCameraCapture("Logitech HD Webcam C270", "I420", 1280, 720);

engine.startCapture();
*/








