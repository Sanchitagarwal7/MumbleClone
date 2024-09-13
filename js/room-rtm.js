const handleMemberJoinend = async (memberID) => {
    addMemberJoinedDOM(memberID); //call the function to change the DOM

    let {name} = await rtmClient.getUserAttributesByKeys(memberID, ['name']); //get 'name' value from 'memberID' specific user
    addBotMessageToDOM(`Welcome to the room ${name}!`); //to diplay bot message

    memberTotal(); //get number of people in the room
}

const addMemberJoinedDOM = async (memberID) => {
    let {name} = await rtmClient.getUserAttributesByKeys(memberID, ['name']); //get 'name' value from 'memberID' specific user

    let memberList = document.getElementById('member__list'); //member list element

    //make new member element
    let newMember = `<div class="member__wrapper" id="member__${memberID}__wrapper">
                        <span class="green__icon"></span>
                        <p class="member_name">${name}</p>
                    </div>`;

    //add new member element to the HTML
    memberList.insertAdjacentHTML('beforeend', newMember); //adds new member to the DOM

    memberTotal(); //get number of people in the room
}

const handleMemberLeft = async (memberID) => {
    removeMemberJoinedDOM(memberID); //call the function to remove the member from the room
    memberTotal(); //after a member leaves, again update the total member count
}

const removeMemberJoinedDOM = async (memberID) => {
    let member_left = document.getElementById(`member__${memberID}__wrapper`); //selet which element to remove

    let {name} = await rtmClient.getUserAttributesByKeys(memberID, ['name']); //get 'name' value from 'memberID' specific user
    addBotMessageToDOM(`${name} left the room!`); //to diplay bot message

    memberTotal(); //get number of people in the room
    member_left.remove(); //remove that current element;
}

const memberTotal = async () => {
    let memberCountElement = document.getElementById('members__count'); //element which displays member counts
    let totalMembersCurrently = await channel.getMembers(); //get all members in the channel joined

    memberCountElement.innerText =  totalMembersCurrently.length;   //set the total members
}

const getTotalMembers = async () => {
    let members = await channel.getMembers(); //get all members in the channel currently

    for(let i = 0; i < members.length; i++){
        addMemberJoinedDOM(members[i]); //add them into the DOM
    }
}

const handleChannelMessage = async (messageData, memberID) => {
    let data = JSON.parse(messageData.text);    //parse the data

    if(data.type === 'chat'){
        addMessageToDOM(data.displayName, data.message); //display message in chat
    }
}

const sendMessage = async (event) => {
    event.preventDefault(); //prevents from reloading

    let msg = event.target.message.value;   //get the message from form
    channel.sendMessage({text: JSON.stringify({'type': 'chat', 'message': msg, 'displayName': displayName})}); //make a data out of this message containing name, message and type of message
    addMessageToDOM(displayName, msg);  //display the message to DOM
    event.target.reset();   //reset the event for further other events
}

const addMessageToDOM = (name, message) => {
    //make the template for DOMs integrating name and message
    let msg = `<div class="message__wrapper">
                        <div class="message__body">
                            <strong class="message__author">${name}</strong>
                            <p class="message__text">${message}</p>
                        </div>
                    </div>`
    //dynamically add the html inside messages
    document.getElementById('messages').insertAdjacentHTML('beforeend', msg); //latest messages will be displayed at last

    //new messages will make the scroll bar, scroll to them
    let chat = document.getElementById('messages');
    if(chat){
        chat.scrollTop = chat.scrollHeight;
    }
} 

const addBotMessageToDOM = (botMessage) => {
    //again make the message for bot message
    let msg = `<div class="message__wrapper">
                    <div class="message__body__bot">
                        <strong class="message__author__bot">🤖 Mumble Bot</strong>
                        <p class="message__text__bot">${botMessage}</p>
                    </div>
                </div>`
    //again make this html inside the messages
    document.getElementById('messages').insertAdjacentHTML('beforeend', msg); //latest messages will be displayed at last

    //for scrolling the scroll bar to new messages
    let chat = document.getElementById('messages');
    if(chat){
        chat.scrollTop = chat.scrollHeight;
    }
} 

const leaveChannel = async () => {
    await rtmClient.leave(); //leave rtm client 
    await rtmClient.logout();  //logout the rtm client
}

window.addEventListener('unload', leaveChannel); //make the client leave the channel when window unloads

let messageForm = document.getElementById('message__form'); //listens to events in message__form
messageForm.addEventListener('submit', sendMessage);    //for submit