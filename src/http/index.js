import axios from 'axios'
import { message } from 'antd'

const SERVER_URL = 'http://ixiaomu.cn:3210/'
// const SERVER_URL = 'http://60.174.196.158:3210/' ///60
// const SERVER_URL = 'http://localhost:3210/' ///本地测试

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
  query: sql => axios.post(SERVER_URL + 'query', { sql }, { headers: { token: localStorage.getItem('token') } }),
  login: (username, password) => axios.post(SERVER_URL + 'login', { username, password }),
  /**************************************************公司*******************************************************/
  getCompany: () => axios.post(SERVER_URL + 'getCompany', {}, { headers: { token: localStorage.getItem('token') } }),
  /**************************************************部门*******************************************************/
  addDepartment: department =>
    axios.post(SERVER_URL + 'addDepartment', department, { headers: { token: localStorage.getItem('token') } }),
  listDepartment: did =>
    axios.post(SERVER_URL + 'listDepartment', { did }, { headers: { token: localStorage.getItem('token') } }),
  listAllDepartment: () =>
    axios.post(SERVER_URL + 'listAllDepartment', {}, { headers: { token: localStorage.getItem('token') } }),
  updateDepartment: params =>
    axios.post(SERVER_URL + 'updateDepartment', params, { headers: { token: localStorage.getItem('token') } }),
  removeDepartment: id =>
    axios.post(SERVER_URL + 'removeDepartment', { id }, { headers: { token: localStorage.getItem('token') } }),
  /**************************************************标签*******************************************************/
  addTag: tag => axios.post(SERVER_URL + 'addTag', tag, { headers: { token: localStorage.getItem('token') } }),
  listTag: tid => axios.post(SERVER_URL + 'listTag', { tid }, { headers: { token: localStorage.getItem('token') } }),
  listAllTag: () => axios.post(SERVER_URL + 'listAllTag', {}, { headers: { token: localStorage.getItem('token') } }),
  updateTag: params =>
    axios.post(SERVER_URL + 'updateTag', params, { headers: { token: localStorage.getItem('token') } }),
  removeTag: id => axios.post(SERVER_URL + 'removeTag', { id }, { headers: { token: localStorage.getItem('token') } }),
  /**************************************************员工*******************************************************/
  addUser: user => axios.post(SERVER_URL + 'addUser', user, { headers: { token: localStorage.getItem('token') } }),
  listUser: did => axios.post(SERVER_URL + 'listUser', { did }, { headers: { token: localStorage.getItem('token') } }),
  listAllUser: _ => axios.post(SERVER_URL + 'listAllUser', {}, { headers: { token: localStorage.getItem('token') } }),
  updateUser: params =>
    axios.post(SERVER_URL + 'updateUser', params, { headers: { token: localStorage.getItem('token') } }),
  removeUser: id =>
    axios.post(SERVER_URL + 'removeUser', { id }, { headers: { token: localStorage.getItem('token') } }),
  /**************************************************仓库*******************************************************/
  addStore: store => axios.post(SERVER_URL + 'addStore', store, { headers: { token: localStorage.getItem('token') } }),
  findStore: params =>
    axios.post(SERVER_URL + 'findStore', params, { headers: { token: localStorage.getItem('token') } }),
  listStore: params =>
    axios.post(SERVER_URL + 'listStore', params, { headers: { token: localStorage.getItem('token') } }),
  listAllStore: tid =>
    axios.post(SERVER_URL + 'listAllStore', { tid }, { headers: { token: localStorage.getItem('token') } }),
  updateStore: params =>
    axios.post(SERVER_URL + 'updateStore', params, { headers: { token: localStorage.getItem('token') } }),
  removeStore: id =>
    axios.post(SERVER_URL + 'removeStore', { id }, { headers: { token: localStorage.getItem('token') } }),
  updateStoreCount: params =>
    axios.post(SERVER_URL + 'updateStoreCount', params, { headers: { token: localStorage.getItem('token') } })
}

export default api
