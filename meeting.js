const engine = require('linkv_rtc_meeting');
const WebGLRender = require('linkv_rtc_meeting/render');

const fs = require("fs");
let os = require("os");

const {AppEnvironment, LVStreamType, LVViewMode} = require('./Constants');

engine.setUseTestEnv(false);
engine.setLogLevel(1);
engine.setISOCountryCode("CN");

let isMac = (os.platform() === "darwin");
let isWin = (os.platform() === "win32");


console.log("sdkversion:", engine.buildVersion());
console.log("appid:", AppEnvironment.TEST_ENVIR, "app sign:", AppEnvironment.TEST_ENVIR_SIGN);
engine.auth(AppEnvironment.RTC_TEST_ENVIR, AppEnvironment.RTC_TEST_TEST_ENVIR_SIGN, "Electron", function (code) {
  console.log("Auth ret:", code);
});


let join_button = document.getElementById("button_join");
let leave_button = document.getElementById("button_leave");


let roomIdInput = document.getElementById("roomId_input");
let userIdInput = document.getElementById("userId_input");

let USER_ID = "H"+AppEnvironment.USER_ID;

engine.setAVConfig({fps:15, bitrate:800, min_bitrate:300, videoCaptureWidth:1280, videoCaptureHeight:720, videoEncodeWidth:192, videoEncodeHeight: 144});

join_button.onclick = function (event) {
  if (roomIdInput.value || roomIdInput.value != undefined) {
    engine.loginRoom(USER_ID, roomIdInput.value, true, false, 3);
  }
  else{
    engine.loginRoom(USER_ID, AppEnvironment.ROOM_ID, true, false, 3);
  }
  engine.startSoundLevelMonitor(50);
}

leave_button.onclick = function (event) {
  engine.logoutRoom();
}

let camera_render = new WebGLRender();
let camera_canvas = document.getElementById('camera_view');
if (!isMac) camera_render.setupI420();
camera_render.initGLfromCanvas(camera_canvas);
camera_render.setViewMode(LVViewMode.AspectFill);
camera_render.setMirrorEnable(false);

let screen_render = new WebGLRender();
let screen_canvas = document.getElementById('screen_view');
if (!isMac&&!isWin) screen_render.setupI420();
screen_render.initGLfromCanvas(screen_canvas);
screen_render.setViewMode(LVViewMode.AspectFit);

// 0,1 存储第一个加入的人的摄像头和屏幕
// 2,3 存储第二个加入的人的摄像头和屏幕，如果需要增加多人，可一次添加视图即可
// 不支持第三个人
var remote_views = [];
var remote_views_info = {};
var current_members = 0;


function startPublishing() {
  engine.startPublishing([LVStreamType.AUDIO_NORMAL, LVStreamType.VIDEO_TINY, LVStreamType.VIDEO_NORMAL, LVStreamType.VIDEO_SCREENCAST]) 
}


function create_remote_views() {
  for (var i = 1; i < 5; i++) {
    let remote_render = new WebGLRender();
    let viewId = 'remote_view' + i;
    let remote_canvas = document.getElementById(viewId);
    console.log(viewId);
    if (!isMac) remote_render.setupI420();
    remote_render.initGLfromCanvas(remote_canvas);
    remote_render.setViewMode(LVViewMode.AspectFit);
    remote_views.push(remote_render);
  }
}
create_remote_views();


if (isMac) {
  engine.on("OnCaptureVideoFrame", function (frame, width, height) {
    camera_render.drawVideoFrame(frame, width, height);
  });
}
else{
  engine.on("OnCaptureVideoFrame", function (Y, U, V, width, height) {
    camera_render.drawI420VideoFrame(width, height, Y, U, V);
  });
}

if (isMac) {
  engine.on("OnDrawFrame", function (userId, frame, width, height, streamType) {
    let id = remote_views_info[userId];
    console.log(userId, remote_views_info, streamType);
    if (id == 0) {
      if (streamType == 2) {
        remote_views[0].drawVideoFrame(frame, width, height);
      }
      else{
        remote_views[1].drawVideoFrame(frame, width, height);
      }
    }
    else{
      if (streamType == 2) {
        remote_views[2].drawVideoFrame(frame, width, height);
      }
      else{
        remote_views[3].drawVideoFrame(frame, width, height);
      }
    }
  });
}
else{
  engine.on("OnDrawFrame", function (userId, Y, U, V, width, height, streamType) {
    let id = remote_views_info[userId];
    console.log(userId, remote_views_info, streamType);
    if (id == 0) {
      if (streamType == 2) {
        remote_views[0].drawI420VideoFrame(width, height, Y, U, V);
      }
      else{
        remote_views[1].drawI420VideoFrame(width, height, Y, U, V);
      }
    }
    else{
      if (streamType == 2) {
        remote_views[2].drawI420VideoFrame(width, height, Y, U, V);
      }
      else{
        remote_views[3].drawI420VideoFrame(width, height, Y, U, V);
      }
    }
  });
}

engine.on("OnCaptureScreenVideoFrame", function (frame, width, height) {
  screen_render.drawVideoFrame(frame, width, height);
  console.log("width:", width, "height:", height);
});

engine.on("OnAddRemoter", function (member) {
  console.log(member);
  if (member.userId == USER_ID) {
    console.log(member.userId, USER_ID);
    return;
  }
  if (current_members >= 2) return;
  remote_views_info[member.userId] = current_members;
  if ((member.msids & 8) != 0) {
    engine.startPlayingStream(member.userId, [1,2,8]);
  }
  else{
    engine.startPlayingStream(member.userId, [1,2]);
  }
  current_members++;
});


engine.on("OnDeleteRemoter", function (userId) {
  console.log(userId);
  current_members--;
  engine.stopPlayingStream(userId, [1,2,8]);
})


engine.on("OnEnterRoomComplete", function (code, userList) {
  console.log("code:", code, "userList", userList);
  current_members = 0;
  startPublishing();
});

engine.on("OnUpdateStream", function (userId, addlist, removelist) {
  if (addlist.length > 0) {
    engine.startPlayingStream(userId, addlist);
  }
  else if(removelist.length > 0){
    engine.stopPlayingStream(userId, addlist);
  }
});

engine.on("OnAudioVolumeUpdate", function (volume){

});

function testCameraCapture(){
  let info = engine.GetVideoCaptureDevice();
  console.log(info);
  if (os.platform() === "darwin") {
    engine.initCameraCapture(info[0].guid, "0", 1280, 720);
  }
  else{
    let info1 = engine.GetCameraResolution(info[0].guid);
    console.log(info1);
    let info2 = engine.GetCameraColorType(info[0].guid, info1[0].width, info1[0].height);
    console.log(info2);
    engine.initCameraCapture(info[0].guid, info2[0], 1280, 720);
  }
  engine.startCapture();
}


function testBeauty() {
  let enable = true;
  let beautyLevel = 50;
  let brightLevel = 50;
  let toneLevel = 50;

  engine.SetBeautyParameter(enable, beautyLevel, brightLevel, toneLevel)
}

function testScreenCapture(){

  let winList = engine.GetWindowsList(0);
  let list = engine.SnapshotWindows([winList[0].id], 0);
  console.log("============>",list," SourceId:",winList[0].id);

  engine.SetMouseCursorEnable(true);
  engine.InitCapture(0, 1280, 720, {x:0, y:0, width:0, height:0});
  engine.StartScreenCapture(winList[0].id, 15);
}


// 设备是否打开 AI
// engine.SetAIEnable(true);
// engine.SetModelPath("/Users/badwin/Downloads/selfie_segmentation.tflite");
// engine.SetBackgroundImage("/Users/badwin/Downloads/image.png");
// // AI 模型
// engine.SetAiModel(
//   "/Users/badwin/Documents/joyme/linkv_rtc_electron/sdk/mac/Resources/model/ai_human_processor_pc.bundle", 
//   "/Users/badwin/Documents/joyme/linkv_rtc_electron/sdk/mac/Resources/graphics/face_beautification.bundle", 
//   "/Users/badwin/Documents/joyme/linkv_rtc_electron/sdk/mac/Resources/items/BackgroundSegmentation/xiandai_ztt_fu.bundle");

testCameraCapture();
testScreenCapture();
// testBeauty();