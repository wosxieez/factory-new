import React, { useState } from 'react'
import { Route, Link } from 'react-router-dom'
import { Layout, Menu, Icon, Modal } from 'antd';
import NewDptAndUser from './newDptAndUser/View'
import TagView from './tag/View'
import StoreHouseView from './storehouse/View'
import ApplyView from './apply/View'
import ApproveView from './approve/View'
import svgs from '../assets/svgs';
import { SubMenu } from 'rc-menu';
import ExportStoreView from './exportStore/ExportStoreView';
import BackStoreView from './backStore/BackStoreView';
import PurchaseStorageView from './purchaseStorage/PurchaseStorageView';
import PurchaseStoreView from './purchaseStore/PurchaseStoreView';
// import CamView from './cam/CamView';
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
        <SubMenu key="库存管理" title={<span><Icon type="reconciliation" /><span>库存管理</span></span>}>
          <Menu.Item key={'/main/storeview'}>
            <Icon type="hdd" />
            <span className="nav-text">库存列表</span>
            <Link to={`${props.match.url}/storeview`} />
          </Menu.Item>
          <Menu.Item key={'/main/purchasestorageview'}>
            <Icon type="shopping-cart" />
            <span className="nav-text">采购入库</span>
            <Link to={`${props.match.url}/purchasestorageview`} />
          </Menu.Item>
        </SubMenu>
        <SubMenu key="报表统计" title={<span><Icon type="area-chart" /><span>报表统计</span></span>}>
          <Menu.Item key={'/main/exportstoreview'}>
            <Icon type="area-chart" />
            <span className="nav-text">出库列表</span>
            <Link to={`${props.match.url}/exportstoreview`} />
          </Menu.Item>
          <Menu.Item key={'/main/backstoreview'}>
            <Icon type="area-chart" />
            <span className="nav-text">退库列表</span>
            <Link to={`${props.match.url}/backstoreview`} />
          </Menu.Item>
          <Menu.Item key={'/main/purchasetoreview'}>
            <Icon type="area-chart" />
            <span className="nav-text">入库列表</span>
            <Link to={`${props.match.url}/purchasetoreview`} />
          </Menu.Item>
        </SubMenu>
        <Menu.Item key="/main/departmentview">
          <Icon type="apartment" />
          <span>部门管理</span>
          <Link to={`${props.match.url}/departmentview`} />
        </Menu.Item>
        {/* <Menu.Item key={'/main/userview'}>
          <Icon type="user" />
          <span className="nav-text">用户列表</span>
          <Link to={`${props.match.url}/userview`} />
        </Menu.Item> */}
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
        <SubMenu key="设置" title={<span><Icon type="setting" /><span>设置</span></span>}>
          <Menu.Item key={'/main/usertag'}>
            <Icon type="tags" />
            <span className="nav-text">用户标签</span>
            <Link to={`${props.match.url}/usertag`} />
          </Menu.Item>
          <Menu.Item key={'/main/storetag'}>
            <Icon type="tags" />
            <span className="nav-text">物料标签</span>
            <Link to={`${props.match.url}/storetag`} />
          </Menu.Item>
        </SubMenu>
        {/* <Menu.Item key={'/main/camview'}>
          <Icon type="tags" />
          <span className="nav-text">摄像头测试</span>
          <Link to={`${props.match.url}/camview`} />
        </Menu.Item> */}
      </Menu>
    </Sider>
    <Layout style={{ marginLeft: collapsed ? 80 : 200 }} >
      <Header style={{ position: 'fixed', zIndex: 10, width: `calc(100% - ${collapsed ? 80 : 200}px)`, backgroundColor: '#fff', padding: 0, borderBottomStyle: 'solid', borderBottomWidth: 1, borderBottomColor: '#e8e8e8' }}>
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
        <Route path={`${props.match.url}/departmentview`} component={NewDptAndUser} />
        <Route path={`${props.match.url}/storeview`} component={StoreHouseView} />
        {/* <Route path={`${props.match.url}/userview`} component={UserView} /> */}
        <Route path={`${props.match.url}/applyview`} component={ApplyView} />
        <Route path={`${props.match.url}/approveview`} component={ApproveView} />
        <Route path={`${props.match.url}/storetag`} component={() => { return <TagView type={0} /> }} />
        <Route path={`${props.match.url}/usertag`} component={() => { return <TagView type={1} /> }} />
        <Route path={`${props.match.url}/exportstoreview`} component={ExportStoreView} />
        <Route path={`${props.match.url}/purchasetoreview`} component={PurchaseStoreView} />
        <Route path={`${props.match.url}/backstoreview`} component={BackStoreView} />
        <Route path={`${props.match.url}/purchasestorageview`} component={PurchaseStorageView} />
        {/* <Route path={`${props.match.url}/camview`} component={CamView} /> */}
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