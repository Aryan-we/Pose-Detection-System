
// ==========================================
// POSE AI - HUMAN POSE DETECTION
// p5.js 1.4.0 + ml5.js 0.12.2
// ==========================================


// Global variables
let video;
let stream;
let posenet;
let canvas;

let singlePose = null;
let skeleton = null;

let specs;
let smoke;

let cameraRunning = false;
let cameraStarting = false;


// ==========================================
// P5.JS SETUP
// ==========================================

function setup() {

    canvas = createCanvas(800, 500);
    canvas.parent('canvas-container');

    // Hide canvas initially
    canvas.hide();

    // Load overlay images
    specs = loadImage(
        'images/spects.png',
        () => console.log('Sunglasses loaded'),
        error => console.error('Sunglasses loading error:', error)
    );

    smoke = loadImage(
        'images/cigar.png',
        () => console.log('Cigar loaded'),
        error => console.error('Cigar loading error:', error)
    );

    // Button events
    document.getElementById('detectBtn')
        .addEventListener('click', startCamera);

    document.getElementById('startCamera')
        .addEventListener('click', startCamera);

    document.getElementById('stopCamera')
        .addEventListener('click', stopCamera);

    updateCameraButtons();

    console.log('PoseAI initialized');

}


// ==========================================
// START CAMERA
// ==========================================

async function startCamera() {

    if (cameraRunning || cameraStarting) {
        return;
    }

    cameraStarting = true;
    updateCameraButtons();

    try {

        // Check camera support
        if (!navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia) {

            throw new Error(
                'Please run this project using HTTPS or localhost.'
            );
        }

        // Check ml5
        if (typeof ml5 === 'undefined' ||
            typeof ml5.poseNet !== 'function') {

            throw new Error(
                'ml5 PoseNet not loaded. Check your script imports.'
            );
        }


        // Request webcam permission
        console.log('Requesting camera permission...');

        stream = await navigator.mediaDevices.getUserMedia({

            video: {
                width: {
                    ideal: 800
                },
                height: {
                    ideal: 500
                },
                facingMode: 'user'
            },

            audio: false

        });


        // Create p5.js video element
        video = createVideo([]);

        video.elt.srcObject = stream;
        video.elt.autoplay = true;
        video.elt.playsInline = true;
        video.elt.muted = true;

        // Hide original video element
        video.hide();


        // Start video playback
        await video.elt.play();


        // Wait for webcam video data
        if (video.elt.readyState < 2) {

            await new Promise((resolve, reject) => {

                video.elt.addEventListener(
                    'loadeddata',
                    resolve,
                    { once: true }
                );

                video.elt.addEventListener(
                    'error',
                    () => reject(
                        new Error('Webcam video could not load.')
                    ),
                    { once: true }
                );

            });

        }


        console.log(
            'Video dimensions:',
            video.elt.videoWidth,
            video.elt.videoHeight
        );


        // Display camera canvas
        cameraRunning = true;
        cameraStarting = false;

        canvas.show();

        const placeholder =
            document.querySelector('.camera-placeholder');

        if (placeholder) {
            placeholder.style.display = 'none';
        }

        select('#cameraStatus').html('Camera Online');
        select('#cameraStatus').addClass('active');

        updateCameraButtons();


        // Scroll to detection section
        document.getElementById('detection')
            .scrollIntoView({
                behavior: 'smooth'
            });


        // ==================================
        // INITIALIZE POSENET
        // ==================================

        console.log('Loading PoseNet...');

        posenet = ml5.poseNet(
            video.elt,
            modelLoaded
        );

        posenet.on('pose', receivedPoses);


    } catch (error) {

        console.error('Camera Error:', error);

        stopCamera();

        alert(
            'Unable to start camera: ' + error.message
        );

    }

}


// ==========================================
// MODEL LOADED
// ==========================================

function modelLoaded() {

    console.log('PoseNet model loaded successfully');

}


// ==========================================
// RECEIVE POSES
// ==========================================

function receivedPoses(results) {

    if (!cameraRunning) {
        return;
    }

    if (results && results.length > 0) {

        singlePose = results[0].pose;

        skeleton = results[0].skeleton;

    } else {

        singlePose = null;

        skeleton = null;

    }

}


// ==========================================
// STOP CAMERA
// ==========================================

function stopCamera() {

    console.log('Stopping camera...');

    cameraRunning = false;
    cameraStarting = false;


    // Stop webcam stream
    if (stream) {

        stream.getTracks().forEach(track => {
            track.stop();
        });

        stream = null;

    }


    // Stop and remove p5 video
    if (video) {

        video.stop();
        video.remove();

        video = null;

    }


    // Reset PoseNet data
    singlePose = null;
    skeleton = null;
    posenet = null;


    // Hide canvas
    if (canvas) {
        canvas.hide();
    }


    // Show placeholder
    const placeholder =
        document.querySelector('.camera-placeholder');

    if (placeholder) {
        placeholder.style.display = 'grid';
    }


    // Update status
    select('#cameraStatus').html('Camera Offline');
    select('#cameraStatus').removeClass('active');

    updateCameraButtons();

    console.log('Camera stopped');

}


// ==========================================
// UPDATE BUTTONS
// ==========================================

function updateCameraButtons() {

    const startBtn =
        document.getElementById('startCamera');

    const stopBtn =
        document.getElementById('stopCamera');

    const detectBtn =
        document.getElementById('detectBtn');


    if (startBtn) {
        startBtn.disabled =
            cameraRunning || cameraStarting;
    }

    if (stopBtn) {
        stopBtn.disabled =
            !cameraRunning;
    }

    if (detectBtn) {
        detectBtn.disabled =
            cameraRunning || cameraStarting;
    }

}


// ==========================================
// DRAW FUNCTION
// ==========================================

function draw() {

    background(5);

    // Check camera
    if (!cameraRunning || !video) {
        return;
    }


    // ==================================
    // DRAW WEBCAM VIDEO
    // ==================================

    image(
        video,
        0,
        0,
        width,
        height
    );


    // ==================================
    // DRAW KEYPOINTS
    // ==================================

    if (singlePose) {

        fill(255, 0, 0);
        noStroke();

        for (let point of singlePose.keypoints) {

            if (point.score > 0.2) {

                ellipse(
                    point.position.x,
                    point.position.y,
                    15,
                    15
                );

            }

        }


        // ==================================
        // DRAW SKELETON
        // ==================================

        if (skeleton) {

            stroke(255);
            strokeWeight(3);

            for (let bone of skeleton) {

                let a = bone[0].position;
                let b = bone[1].position;

                line(
                    a.x,
                    a.y,
                    b.x,
                    b.y
                );

            }

        }


        // ==================================
        // SUNGLASSES OVERLAY
        // ==================================

        if (
            specs &&
            specs.width > 0 &&
            singlePose.nose &&
            singlePose.leftEye &&
            singlePose.rightEye
        ) {

            let eyeDistance = dist(
                singlePose.leftEye.x,
                singlePose.leftEye.y,
                singlePose.rightEye.x,
                singlePose.rightEye.y
            );

            image(
                specs,
                singlePose.nose.x - eyeDistance,
                singlePose.nose.y - eyeDistance,
                eyeDistance * 2,
                eyeDistance * 1.3
            );

        }


        // ==================================
        // CIGAR OVERLAY
        // ==================================

        if (
            smoke &&
            smoke.width > 0 &&
            singlePose.nose
        ) {

            image(
                smoke,
                singlePose.nose.x - 35,
                singlePose.nose.y + 10,
                45,
                45
            );

        }

    }

}


// ==========================================
// CLEANUP WHEN PAGE CLOSES
// ==========================================

window.addEventListener('beforeunload', () => {

    if (stream) {

        stream.getTracks().forEach(track => {
            track.stop();
        });

    }

});
