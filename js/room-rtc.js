const APP_ID = "c7208c35f3b74610ad439b059c648629";

let uid = sessionStorage.getItem('uid'); //check session storage if it has same uid before
if(!uid){ //if not then generate one
    uid = String(Math.floor(Math.random()*10000));
    sessionStorage.setItem('uid', uid); //save it in session storage
}

let token = null; //for production
let client; //client
let rtmClient; //for real time signalling and messaging
let channel; //channel

let localScreenTracks; //local screen tracks will be stored here
let screenIsOff = true; //initially the screen share will be off for everyone

//room.html?room=123
const queryString = window.location.search; //get the string
const urlParams = new URLSearchParams(queryString); //get the params
let roomID = urlParams.get('room'); //from params, get the rooms

if(!roomID){ //if there is no roomID then redirect to lobby or main
    roomID = 'main';
}

//if the user dosen't have a username then they cannot enter room page
let displayName = sessionStorage.getItem('display_name');
if(!displayName){
    window.location = 'lobby.html';
}

let localTracks = []; //local audio and video tracks stored as an array
let remoteUsers = {}; //object because for key: value pair, key: uid, value: remote audio and video

const joinRoomInit = async () => {
    rtmClient = await AgoraRTM.createInstance(APP_ID); //creates a rtm instance
    await rtmClient.login({uid, token}); //logs the rtm client to the rtm system

    await rtmClient.addOrUpdateLocalUserAttributes({'name': displayName}); //add name attribute along with memberid


    channel = await rtmClient.createChannel(roomID); //create the messaging channel
    await channel.join();   //join the channel

    client = AgoraRTC.createClient({mode: 'rtc', codec: 'vp8'}); //create client
    await client.join(APP_ID, roomID, token, uid); //join the client

    channel.on('MemberJoined', handleMemberJoinend); //when memeber joins a channel
    channel.on('MemberLeft', handleMemberLeft); //when memeber joins a channel
    channel.on('ChannelMessage', handleChannelMessage); //when a message is sent in the channel

    getTotalMembers(); //get all member ids just after joining
    addBotMessageToDOM(`Welcome to the room ${displayName}!`); //to diplay bot message

    client.on('user-published', handleUserPublished); //listen to client
    client.on('user-left', handleUserLeft); //listen to client

    joinStream(); //imediately join the streams
}

const joinStream = async () => {
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({}, {encoderConfig: {
        width: {min: 640, ideal: 1920, max: 1920},
        video: {
            facingMode: 'user',
            min: 480, ideal: 1080, max: 1080
        }
    }}); //it will ask for audio and video feed

    //each player would have an unique id
    let player = `<div class="video_container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div> 
                    </div>`
    //add this player into the DOM
    document.getElementById('streams_container').insertAdjacentHTML('beforeend', player);
    document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame);

    localTracks[1].play(`user-${uid}`); //localTracks[1] will have video stream and it will play that into 'video-player' div 

    await client.publish([localTracks[0], localTracks[1]]); //this will trigger (user-publish) event listener
}

const switchToCamera = async () => {
    //again make the player
    let player = `<div class="video_container" id="user-container-${uid}">
                  <div class="video-player" id="user-${uid}"></div> 
                  </div>`
    let videoFrames = document.getElementById('streams_container'); //get display frames
    videoFrames.insertAdjacentHTML('beforeend', player); //add the new html element player

    await localTracks[0].setMuted(true); //just after stopping the sharing of screen the audio will be muted
    await localTracks[1].setMuted(true); //just after stopping the sharing of screen the video will be muted

    document.getElementById('mic-btn').classList.remove('active'); //mic button will be deactivated
    document.getElementById('screen-btn').classList.remove('active'); //screen button will also be deactivated

    localTracks[1].play(`user-${uid}`);     //play the local tracks again
    await client.publish([localTracks[1]]);  //also publish the locak tracks for remote users
}

const handleUserPublished = async (user, mediaType) => {
    remoteUsers[user.uid] = user; //set this user to remote users object

    await client.subscribe(user, mediaType); //subsribe to this user's stream

    let player = document.getElementById(`user-container-${user.uid}`); //select player

    //if it is not found then set the stream to that user, otherwise we dont want different players for same user logging again
    if(player === null){
        player = `<div class="video_container" id="user-container-${user.uid}">
        <div class="video-player" id="user-${user.uid}"></div> 
        </div>`

        //add this player into the DOM
        document.getElementById('streams_container').insertAdjacentHTML('beforeend', player); //add the new html element player
        //when click on video frame with click event, set a method
        document.getElementById(`user-container-${user.uid}`).addEventListener('click', expandVideoFrame);
    }

    //if a player has a style that means someone is streaming, so style new user circle to small circle
    if(document.getElementById('stream-box').style.display){
        let videoFrame = document.getElementById(`user-container-${user.id}`)
        videoFrame.style.height = '100px';
        videoFrame.style.width = '100px';
    }

    if(mediaType==='video'){
        user.videoTrack.play(`user-${user.uid}`); //play that video to remote user's video local track
    }
    if(mediaType==='audio'){
        user.audioTrack.play(); //simply play the audio
    }
}

const handleUserLeft = async (user) => {
    delete remoteUsers[user.uid]; //delete from remote users object
    document.getElementById(`user-container-${user.uid}`).remove(); //remote the html element from DOM

    if(userIDinDisplayFrame === `user-container-${user.uid}`){
        displayFrame.style.display = null;

        let videoFrames = document.getElementsByClassName('video_container');
        for(let i = 0; i<videoFrames.length; i++){
            videoFrames[i].style.height = '300px';
            videoFrames[i].style.width = '300px';
        }
    }
}

const toggleCamera = async (event) => {

    let button  = event.currentTarget;

    if(localTracks[1].muted){
        await localTracks[1].setMuted(false);
        button.classList.add('active');
    }else{
        await localTracks[1].setMuted(true);
        button.classList.remove('active');
    }
}

const toggleMic = async (event) => {

    let button  = event.currentTarget;

    if(localTracks[0].muted){
        await localTracks[0].setMuted(false);
        button.classList.add('active');
    }else{
        await localTracks[0].setMuted(true);
        button.classList.remove('active');
    }
}

const handleScreenShare = async (event) => {
    let screenButton = event.currentTarget; //get the screen button
    let cameraButton = document.getElementById('camera-btn'); //get camera button

    screenIsOff = !screenIsOff; //if screen is on, make it off and vice versa
    if(!screenIsOff){
        //screen needs to be on 
        screenButton.classList.add('active'); //highlight the icons

        cameraButton.classList.remove('active'); //remove highlight from camera
        cameraButton.style.display = 'none'; //when sreen sharing is on, hide the camera button

        startCapture(); //start capturing
    }else{
        //screen needs to be off
        cameraButton.style.display = 'block'; //when screen sharing is off, un-hide the camera button
        screenButton.classList.remove('active'); //highlight the icons
        document.getElementById(`user-container-${uid}`).remove(); //remove the container
        stopCapture(); //stop sharing the screen
    }
}

const startCapture = async () => {
    localScreenTracks = await AgoraRTC.createScreenVideoTrack(); //gets the screen video tracks

    document.getElementById(`user-container-${uid}`).remove(); //remove the current user element with camerass
    displayFrame.style.display = 'block';   //make displayFrame as block

    //create a player
    let player = `<div class="video_container" id="user-container-${uid}">
                  <div class="video-player" id="user-${uid}"></div> 
                  </div>`

    displayFrame.insertAdjacentHTML('beforeend', player);   //in display frame add the player
    document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame);  //on clicking expand it

    userIDinDisplayFrame = `user-container-${uid}`; //update user id in displayFrame
    localScreenTracks.play(`user-${uid}`);  //play the local screen tracks of user-${uid}

    await client.unpublish([localTracks[1]]); //disable video track when screen sharing
    await client.publish([localScreenTracks]); //enable video track for others when screen sharing
}

const stopCapture = async () => {
    await client.unpublish([localScreenTracks]); //unpubish the screen player
    switchToCamera(); //switch to camera after stop sharing screen
}
const handleLeave = async (event) => {
    event.preventDefault();

    document.getElementById('join-btn').style.display = 'block';
    document.getElementsByClassName('stream__actions')[0].style.display = 'none';

    for(let i = 0; i < localTracks.length; i++){
        localTracks[i].stop();
        localTracks[i].close();
    }

    await client.unpublish([localTracks[0], localTracks[1]]);

    if(localScreenTracks){
        await client.unpublish([localScreenTracks]);
    }

    document.getElementById(`user-container-${uid}`).remove();
}

document.getElementById('camera-btn').addEventListener('click', toggleCamera); //add event listener to toggle camera
document.getElementById('mic-btn').addEventListener('click', toggleMic);    //add event listener to toggle mic
document.getElementById('screen-btn').addEventListener('click', handleScreenShare); //add event listener to toggle screen
document.getElementById('leave-btn').addEventListener('click', handleLeave);

joinRoomInit(); //initialise room joining
