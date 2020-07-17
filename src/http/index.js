import axios from 'axios'
import { message } from 'antd'
// const SERVER_URL = 'http://127.0.0.1:3210/'
const SERVER_URL = 'http://192.168.1.102:3210/'
// const SERVER_URL = 'http://chengliankeji.cn:3210/'

let thisToken = ''

// 响应拦截器
axios.interceptors.response.use(
  response => {
    if (response.data.code === -99) {
      message.error({
        content: response.data.data,
        key: 'thisistokenerrorkey'
      })
      return Promise.reject(response.data.data)
    }
    return response.data
  },
  error => {
    message.error({
      content: '网络异常，请检查网络连接',
      key: 'thisisneterrorkey'
    })
    return Promise.reject(error)
  }
)

const api = {
  login: (username, password) => axios.post(SERVER_URL + 'login', { username, password }),
  setToken: token => {
    thisToken = token
  },
  /**************************************************query*******************************************************/
  query: sql => axios.post(SERVER_URL + 'query', { sql }, { headers: { token: thisToken } }),
  /**************************************************部门*******************************************************/
  addDepartment: department => axios.post(SERVER_URL + 'addDepartment', department, { headers: { token: thisToken } }),
  listDepartment: did => axios.post(SERVER_URL + 'listDepartment', { did }, { headers: { token: thisToken } }),
  updateDepartment: params => axios.post(SERVER_URL + 'updateDepartment', params, { headers: { token: thisToken } }),
  removeDepartment: id => axios.post(SERVER_URL + 'removeDepartment', { id }, { headers: { token: thisToken } }),
  /**************************************************标签*******************************************************/
  addTag: tag => axios.post(SERVER_URL + 'addTag', tag, { headers: { token: thisToken } }),
  listTag: tid => axios.post(SERVER_URL + 'listTag', { tid }, { headers: { token: thisToken } }),
  updateTag: params => axios.post(SERVER_URL + 'updateTag', params, { headers: { token: thisToken } }),
  removeTag: id => axios.post(SERVER_URL + 'removeTag', { id }, { headers: { token: thisToken } }),
  /**************************************************员工*******************************************************/
  addUser: user => axios.post(SERVER_URL + 'addUser', user, { headers: { token: thisToken } }),
  listUser: did => axios.post(SERVER_URL + 'listUser', { did }, { headers: { token: thisToken } }),
  updateUser: params => axios.post(SERVER_URL + 'updateUser', params, { headers: { token: thisToken } }),
  removeUser: id => axios.post(SERVER_URL + 'removeUser', { id }, { headers: { token: thisToken } }),
  /**************************************************仓库*******************************************************/
  addStore: store => axios.post(SERVER_URL + 'addStore', store, { headers: { token: thisToken } }),
  listStore: tid => axios.post(SERVER_URL + 'listStore', { tid }, { headers: { token: thisToken } }),
  updateStore: params => axios.post(SERVER_URL + 'updateStore', params, { headers: { token: thisToken } }),
  removeStore: id => axios.post(SERVER_URL + 'removeStore', { id }, { headers: { token: thisToken } }),
}

export default api
