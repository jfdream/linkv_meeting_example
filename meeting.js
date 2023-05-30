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

// 1920x1080 建议 bitrate: 2300,  min_bitrate: 900
// 1280x720 建议 bitrate: 1800,  min_bitrate: 600
// 960x540 建议 bitrate: 1200,  min_bitrate: 600

engine.setAVConfig({fps:15, bitrate:1800, min_bitrate:600, videoEncodeWidth:1280, videoEncodeHeight: 720});

join_button.onclick = function (event) {
  if (roomIdInput.value || roomIdInput.value != undefined) {
    engine.loginRoom(USER_ID, roomIdInput.value, true, false);
  }
  else{
    engine.loginRoom(USER_ID, AppEnvironment.ROOM_ID, true, false);
  }
  engine.startSoundLevelMonitor(50);
}

leave_button.onclick = function (event) {
  engine.logoutRoom();
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

engine.on("OnCaptureVideoFrame", function (frame, width, height) {
  camera_render.drawVideoFrame(frame, width, height);
  // engine.SendVideoFrame(frame, width * 4, width, height, "");
});

engine.on("OnDrawFrame", function (userId, frame, width, height) {
  let viewId = remote_views_info[userId];
  remote_views[viewId].drawVideoFrame(frame, width, height);
});

engine.on("OnCaptureScreenVideoFrame", function (frame, width, height) {
  screen_render.drawVideoFrame(frame, width, height);
  engine.SendVideoFrame(frame, width * 4, width, height, "");
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


engine.on("OnEnterRoomComplete", function (code, userList) {
  console.log("OnEnterRoomComplete code:", code, "userList", userList);
  current_members = 0;
  startPublishing();
});

engine.on("OnAudioVolumeUpdate", function (volume){

});

function startCameraCapture(){
  console.log("startCameraCapture");
  let devices = engine.GetVideoCaptureDevice();
  console.log("devices:",devices);

  let resolutions = engine.GetCameraResolution(devices[0].guid);
  console.log("resolutions:",resolutions);

  let colorTypes = engine.GetCameraColorType(devices[0].guid, resolutions[0].width, resolutions[0].height);
  console.log("colorTypes:",colorTypes);
  
  engine.initCameraCapture(devices[0].guid, colorTypes[0], 500, 500);
  engine.startCapture();
}

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
  engine.SetMouseCursorEnable(true);
  engine.InitCapture(0, 1280, 720, {x:0, y:0, width:1280, height:1280});
  engine.StartScreenCapture(winList[0].id, 15);
}

startCameraCapture();
startSnapshotWindows();





