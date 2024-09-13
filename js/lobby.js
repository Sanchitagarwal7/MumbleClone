//get form
let form = document.getElementById('lobby__form');

let nameStoredinLocalStorage = sessionStorage.getItem('display_name');
if(nameStoredinLocalStorage){
    form.name.value = nameStoredinLocalStorage;
}

const handleSubmit = async (event) => {
    event.preventDefault(); //prevents the form from getting refreshed

    let name = document.getElementById('inputName').value; //get the user name
    sessionStorage.setItem('display_name', name); //set the name locally
    
    let roomID = document.getElementById('roomID').value;   //get room id

    if(!roomID){ //if there is no room id  then generate one randomly
        roomID = String(Math.random()*10000);
    }

    window.location = `room.html?room=${roomID}`; //send user to at this location
}

form.addEventListener('submit', handleSubmit); //add event listener when somebody submits the form