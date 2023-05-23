# linkv_rtc_meeting SDK 使用流程

## 初始化环境，鉴权

```js
engine.setUseTestEnv(false);
engine.setLogLevel(1);
engine.setISOCountryCode("CN");

// 请务必传用户 ID 参数，否则会影响调度
engine.auth(AppEnvironment.RTC_TEST_ENVIR, AppEnvironment.RTC_TEST_TEST_ENVIR_SIGN, AppEnvironment.USER_ID, function (code) {
  console.log("Auth ret:", code);
});


```


## 设置音视频编码参数

```js

// 摄像头视频编码使用 setAVConfig
engine.setAVConfig({fps:15, bitrate:1800, min_bitrate:800, videoCaptureWidth:1280, videoCaptureHeight:720, videoEncodeWidth:192, videoEncodeHeight: 144});

```


## 加入房间


```js


//   loginRoom(userId, roomId, isHost, isAudioOnly)
// 房间类型固定写死为 3
engine.loginRoom(USER_ID, AppEnvironment.ROOM_ID, true, false);

```



## 开始推流

```js

function startPublishing() {
  engine.startPublishing() 
}

```


## PK 和取消 PK
```
// 由于支持多人 PK 团战，故需要传 roomId 和 userId

// 对方房间 ID， 对方用户 ID
engine.linkRoom(roomId, userId);

// 取消 PK
engine.unlinkRoom(roomId, userId);

```


## 打开和关闭摄像头请参考 meeting.js 中的摄像头和屏幕相关代码
```js

// 摄像头打开之后如果调用了推流代码，则直接推流到服务端
testCameraCapture();
testScreenCapture();

```


## 主动发送视频数据

```

// SendVideoFrame(buff, stride, width, height, sei)
// 第二个参数表示一行像素点占多少字节，如果数据是稠密的，一般是宽度的四倍， SEI 是用户自定义文本字符串，可以随视频帧传给对方用户
engine.SendVideoFrame(frame, width * 4, width, height, "", 0);

```


## 开始拉流

```js
// 其中 1 表示声音，2 表示摄像头正常码率， 4 表示摄像头小码率流（小窗口展示）， 8 表示屏幕视频流
engine.startPlayingStream(userId);
```



## 视频监听

```js
// 摄像头采集视频
if (isMac) {
  engine.on("OnCaptureVideoFrame", function (frame, width, height) {
    render.drawVideoFrame(frame, width, height);
  });
}
else{
  engine.on("OnCaptureVideoFrame", function (Y, U, V, width, height) {
    render.drawI420VideoFrame(width, height, Y, U, V);
  });
}


// 拉取到的远端用户视频
if (isMac) {
    engine.on("OnDrawFrame", function (userId, frame, width, height) {
        render.drawVideoFrame(frame, width, height);
    })
}
else {
    engine.on("OnDrawFrame", function (userId, Y, U, V, width, height) {
        render.drawI420VideoFrame(width, height, Y, U, V);
    })
}
```