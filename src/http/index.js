import axios from 'axios'
const SERVER_URL = 'http://127.0.0.1:3110/'

const api = {
  //---------------------------------------------group api---------------------------------------------
  addGroup: name => axios.post(SERVER_URL + 'addGroup', { name })
}

export { api }
