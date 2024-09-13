let messagesContainer = document.getElementById('messages');
messagesContainer.scrollTop = messagesContainer.scrollHeight;

const memberContainer = document.getElementById('members__container');
const memberButton = document.getElementById('members__button');

const chatContainer = document.getElementById('messages__container');
const chatButton = document.getElementById('chat__button');

let activeMemberContainer = false;

memberButton.addEventListener('click', () => {
  if (activeMemberContainer) {
    memberContainer.style.display = 'none';
  } else {
    memberContainer.style.display = 'block';
  }

  activeMemberContainer = !activeMemberContainer;
});

let activeChatContainer = false;

chatButton.addEventListener('click', () => {
  if (activeChatContainer) {
    chatContainer.style.display = 'none';
  } else {
    chatContainer.style.display = 'block';
  }

  activeChatContainer = !activeChatContainer;
});

let displayFrame = document.getElementById('stream-box') //display frame for video streaming
let videoFrames = document.getElementsByClassName('video_container')  //container to hold video of participants
let userIDinDisplayFrame = null;  //display name of person streaming

const expandVideoFrame = (event) => { //event for expanding a video and audio when clicking on it

  let child = displayFrame.children[0]; //this child will be video, as videotraack was stored at 0 index

  if(child){ //if already video is streaming, then swap that video to back to streams container
    document.getElementById('streams_container').appendChild(child);
  }
  displayFrame.style.display = 'block'; //make display style to block element
  displayFrame.appendChild(event.currentTarget); //and display style make it to current target of event
  userIDinDisplayFrame = event.currentTarget.id;  //user id name would be current target event name

  //those participants who are not the one that are streaming, make them smaller
  for(let i = 0; i<videoFrames.length; i++){ 
    if(userIDinDisplayFrame != videoFrames[i].id){
      videoFrames[i].style.height = '100px';
      videoFrames[i].style.width = '100px';
    }
  }
}

for(let i = 0; i<videoFrames.length; i++){
  videoFrames[i].addEventListener('click', expandVideoFrame); //traverse all video frames and add event listener to them
}

const hideDisplayFrame = () => { //hide display frame
  userIDinDisplayFrame = null;
  displayFrame.style.display = null;

  let child = displayFrame.children[0];
  document.getElementById('streams_container').appendChild(child);

  for(let i = 0; i < videoFrames.length; i++){
      videoFrames[i].style.height = '300px';
      videoFrames[i].style.width = '300px';
  }
}

displayFrame.addEventListener('click', hideDisplayFrame);