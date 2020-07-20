import React, { useState } from 'react'
import { Route, Link } from 'react-router-dom'
import { Layout, Menu, Icon, Modal } from 'antd';
import DepartmentView from './department/View'
import TagView from './tag/View'
import UserView from './user/View'
import StoreHouseView from './storehouse/View'
import ApplyView from './apply/View'
import ApproveView from './approve/View'
import svgs from '../assets/svgs';
import { SubMenu } from 'rc-menu';
const { Header, Content, Sider } = Layout;
export default (props) => {
  const [collapsed, setCollapsed] = useState(false)
  return <Layout>
    <Sider style={styles.side} width='200' trigger={null} collapsible collapsed={collapsed}>
      <div style={styles.logo} >
        <span style={styles.titleIcon}>{svgs.loginTitle(30, 30, '#FFFFFF')}</span>
        <span style={{ ...styles.title, visibility: collapsed ? 'hidden' : 'visible' }}>Welcome</span>
      </div>
      <Menu theme="dark" mode="inline" selectedKeys={[props.location.pathname]}>
        <SubMenu key="物料管理" title={<span><Icon type="code-sandbox" /><span>物料管理</span></span>}>
          <Menu.Item key={'/main/storeview'}>
            <Icon type="code-sandbox" />
            <span className="nav-text">物料列表</span>
            <Link to={`${props.match.url}/storeview`} />
          </Menu.Item>
          <Menu.Item key={'/main/storetag'}>
            <Icon type="tags" />
            <span className="nav-text">物料标签</span>
            <Link to={`${props.match.url}/storetag`} />
          </Menu.Item>
        </SubMenu>
        <Menu.Item key="/main/departmentview">
          <Icon type="apartment" />
          <span>部门列表</span>
          <Link to={`${props.match.url}/departmentview`} />
        </Menu.Item>
        <SubMenu key="用户管理" title={<span><Icon type="user" /><span>用户管理</span></span>}>
          <Menu.Item key={'/main/userview'}>
            <Icon type="user" />
            <span className="nav-text">用户列表</span>
            <Link to={`${props.match.url}/userview`} />
          </Menu.Item>
          <Menu.Item key={'/main/usertag'}>
            <Icon type="tags" />
            <span className="nav-text">用户标签</span>
            <Link to={`${props.match.url}/usertag`} />
          </Menu.Item>
        </SubMenu>
        <Menu.Item key={'/main/applyview'}>
          <Icon type="form" />
          <span className="nav-text">物品申请</span>
          <Link to={`${props.match.url}/applyview`} />
        </Menu.Item>
        <Menu.Item key={'/main/approveview'}>
          <Icon type="ordered-list" />
          <span className="nav-text">申请审批</span>
          <Link to={`${props.match.url}/approveview`} />
        </Menu.Item>
      </Menu>
    </Sider>
    <Layout style={{ marginLeft: collapsed ? 80 : 200 }} >
      <Header style={{ position: 'fixed', zIndex: 1, width: `calc(100% - ${collapsed ? 80 : 200}px)`, backgroundColor: '#fff', padding: 0, borderBottomStyle: 'solid', borderBottomWidth: 1, borderBottomColor: '#e8e8e8' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: `100%`, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Icon
            style={styles.trigger}
            type={collapsed ? 'menu-unfold' : 'menu-fold'}
            onClick={() => { setCollapsed(!collapsed) }}
          />
          <Icon style={styles.trigger} type="poweroff" onClick={() => {
            Modal.confirm({
              title: `确认要退出吗？`,
              okText: '确定',
              okType: 'danger',
              onOk: async function () {
                localStorage.removeItem('cname');
                props.history.push('/')
              }
            })
          }} />
        </div>
      </Header>
      <Content style={{ margin: '80px 16px 0', overflow: 'initial', height: '100vh' }}>
        <Route path={`${props.match.url}/departmentview`} component={DepartmentView} />
        <Route path={`${props.match.url}/storeview`} component={StoreHouseView} />
        <Route path={`${props.match.url}/userview`} component={UserView} />
        <Route path={`${props.match.url}/applyview`} component={ApplyView} />
        <Route path={`${props.match.url}/approveview`} component={ApproveView} />
        <Route path={`${props.match.url}/storetag`} component={() => { return <TagView type={0} /> }} />
        <Route path={`${props.match.url}/usertag`} component={() => { return <TagView type={1} /> }} />
      </Content>
    </Layout>
  </Layout>
}


const styles = {
  logo: {
    height: "32px",
    // background: "rgba(200, 200, 200, 1)",
    margin: "16px",
  },
  side: {
    overflow: 'auto',
    height: '100vh',
    position: 'fixed',
    left: 0,
  },
  trigger: {
    fontSize: "18px",
    lineHeight: "64px",
    padding: "0 24px",
    cursor: "pointer",
    transition: "color 0.3s"
  },
  titleIcon: {
    marginLeft: 10
  },
  title: {
    fontSize: 20,
    fontWeight: 800,
    fontStyle: 'oblique',
    color: '#F0F0F0',
    marginLeft: 10,
    position: 'absolute',
  },
}