// Video trasmission example
const constraints = {
    audio: true,
    video: {
        width: { min: 1280 },
        height: { min: 720 }
    }
};

$(function () {

    const localVideo = document.createElement('video');
    localVideo.autoplay = true;
    localVideo.muted = true;
    document.body.appendChild(localVideo);

    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        localVideo.srcObject = stream;
    });
});
