const {AppEnvironment, LVStreamType, LVViewMode} = require('./Constants');
var engine = null
var WebGLRender = null
if (AppEnvironment.IS_LOCAL_DEBUG) {
  engine = require('./build/Release/linkv_engine');
  WebGLRender = require('./render');
}
else {
  engine = require('linkv_rtc_meeting');
  WebGLRender = require('linkv_rtc_meeting/render');
}
let os = require("os");
engine.setUseTestEnv(true);
engine.setLogLevel(1);
engine.setISOCountryCode("CN");

let isMac = (os.platform() === "darwin");
let isWin = (os.platform() === "win32");


console.log("sdkversion:", engine.buildVersion());
console.log("appid:", AppEnvironment.TEST_ENVIR, "app sign:", AppEnvironment.TEST_ENVIR_SIGN);

engine.SetForceUseSoftwareEncoder(true)

engine.auth(AppEnvironment.TEST_ENVIR, AppEnvironment.TEST_ENVIR_SIGN, "Electron", function (code) {
  console.log("Auth ret:", code);
});

engine.StartAudioRecording();
engine.SetAudioRecordFlag(0x04);

let join_button = document.getElementById("button_join");
let leave_button = document.getElementById("button_leave");


let roomIdInput = document.getElementById("roomId_input");
let userIdInput = document.getElementById("userId_input");

let USER_ID = "H"+AppEnvironment.USER_ID;

// 1920x1080 建议 bitrate: 2300,  min_bitrate: 900
// 1280x720 建议 bitrate: 1800,  min_bitrate: 600
// 960x540 建议 bitrate: 1200,  min_bitrate: 600

engine.setAVConfig({fps:15, bitrate:1800, min_bitrate:600, videoEncodeWidth:1280, videoEncodeHeight: 720});

// engine.mixStream({"width":1280, "height":100, "outputFps":90, "outputBitrate":43, "pushUrls":["12334"], "inputStreamList":[{"x":1, "y":2, "width":323, "height":433, "userId":"yangyudong"}], "outputBackgroundColor":"123","outputBackgroundImage":"4567"});

join_button.onclick = function (event) {
  if (roomIdInput.value || roomIdInput.value != undefined) {
    engine.loginRoom(USER_ID, roomIdInput.value, true, false);
  }
  else{
    engine.loginRoom(USER_ID, AppEnvironment.ROOM_ID, true, false);
  }
  console.log("audio devices:", engine.GetAudioCaptureDevice());
}

leave_button.onclick = function (event) {
  engine.logoutRoom();
  // engine.stopMixStream();
}

let camera_render = new WebGLRender();
camera_render.initGLfromCanvas(document.getElementById('camera_view'));
camera_render.setViewMode(LVViewMode.AspectFill);
camera_render.setMirrorEnable(false);

let screen_render = new WebGLRender();
screen_render.initGLfromCanvas(document.getElementById('screen_view'));
screen_render.setViewMode(LVViewMode.AspectFit);

// 0,1 存储第一个加入的人的摄像头和屏幕
// 2,3 存储第二个加入的人的摄像头和屏幕，如果需要增加多人，可一次添加视图即可
// 不支持第三个人
var remote_views = [];
var remote_views_info = {};
var current_members = 0;


function startPublishing() {
  engine.startPublishing() 
}


function create_remote_views() {
  for (var i = 1; i < 5; i++) {
    let remote_render = new WebGLRender();
    let viewId = 'remote_view' + i;
    let remote_canvas = document.getElementById(viewId);
    remote_render.initGLfromCanvas(remote_canvas);
    remote_render.setViewMode(LVViewMode.AspectFit);
    remote_views.push(remote_render);
  }
}
create_remote_views();

engine.on("OnCaptureVideoFrame", function (cameraId, frame, width, height) {
  camera_render.drawVideoFrame(frame, width, height);
  engine.SendVideoFrame(frame, width * 4, width, height, "");
  // console.log("cameraId:", cameraId, " width:", width, " height:", height);
});

engine.on("OnDrawFrame", function (userId, frame, width, height) {
  let viewId = remote_views_info[userId];
  remote_views[viewId].drawVideoFrame(frame, width, height);
});

engine.on("OnCaptureScreenVideoFrame", function (windowId, frame, width, height) {
  screen_render.drawVideoFrame(frame, width, height);
  // engine.SendVideoFrame(frame, width * 4, width, height, "");
});

engine.on("OnAddRemoter", function (member) {
  console.log("OnAddRemoter:", member);
  if (member.userId == USER_ID) {
    console.log(member.userId, USER_ID);
    return;
  }
  if (current_members >= 4) return;
  remote_views_info[member.userId] = current_members;
  engine.startPlayingStream(member.userId);
  current_members++;
});


engine.on("OnDeleteRemoter", function (userId) {
  console.log("OnDeleteRemoter:",userId);
  current_members--;
  engine.stopPlayingStream(userId);
})

engine.on("OnPublishStateUpdate",function (code) {
  engine.mixStream({"width":1280, "height":720, "outputFps":15, "outputBitrate":1800, "pushUrls":["http://www.baidu.com/rtmp.flv"], "inputStreamList":[{"x":0, "y":0, "width":1280, "height":720, "userId":"88990088"}], "outputBackgroundColor":"#783278","outputBackgroundImage":"http://www.baidu.com/rtmp.png"});
})

engine.on("OnEnterRoomComplete", function (code, userList) {
  console.log("OnEnterRoomComplete code:", code, "userList", userList);
  current_members = 0;
  startPublishing();
});

engine.on("OnAudioVolumeUpdate", function (volume){
});

engine.on("OnCaptureAudioFrame", function (frame, sampleRate, channels, type){
  // console.log(frame, sampleRate, channels, type);
});

engine.SetAudioRecordFlag(2);

var cameraId = ""

function startCameraCapture(){
  console.log("startCameraCapture");
  let devices = engine.GetVideoCaptureDevice();
  console.log("devices:",devices);

  let resolutions = engine.GetCameraResolution(devices[0].guid);
  console.log("resolutions:",resolutions);

  let colorTypes = engine.GetCameraColorType(devices[0].guid, resolutions[0].width, resolutions[0].height);
  console.log("colorTypes:",colorTypes);

  cameraId = devices[0].guid;
  engine.initCameraCapture(cameraId, colorTypes[0], 1080, 1080);
  engine.startCapture();
}

var sourceId = 0;

function startSnapshotWindows(){
  console.log("startSnapshotWindows");
  let winList = null;
  if (AppEnvironment.IS_LOCAL_DEBUG) {
    winList = engine.GetWindowsList(0);
  }
  else {
    winList = engine.GetScreenList();
  }
  let images = engine.SnapshotWindows([winList[0].id], 0);
  console.log("winList:=========>", winList, "images:======>",images);
  let image = images[0].buffer;
  screen_render.drawVideoFrame(image, images[0].width, images[0].height);
  // console.log("winList:=========>", winList, "images:======>",images);
  // engine.SetMouseCursorEnable(true);
  // engine.InitCapture(1, 1280, 720, {x:0, y:0, width:1280, height:1280});
  // engine.SetWindowCaptureScaler(0.5);
  // engine.StartScreenCapture(winList[0].id, 15);

  engine.InitCapture(1, 1280, 720, {x:0, y:0, width:1280, height:1280});
  engine.SetWindowCaptureScaler(0.5);
  engine.StartScreenCapture(winList[0].id, 15);

  sourceId = winList[0].id
}

function startAudioRecording(){
  console.log("audio devices:", engine.GetAudioCaptureDevice());
  engine.StartAudioRecording();
}

startCameraCapture();
startSnapshotWindows();


var kk = 0;

leave_button.onclick = function (event) {

  // engine.stopCapture(cameraId);
  winList = engine.GetWindowsList(1);
  console.log(winList);
  // engine.logoutRoom();
  // engine.stopMixStream();
  // engine.StopScreenCapture();
  // startSnapshotWindows();
    // engine.SetWindowCaptureScaler(sourceId, 0.5 + kk / 100.0);
  kk = kk + 1;
}


