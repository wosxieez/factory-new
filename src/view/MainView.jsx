import React, { useState, useContext, useEffect } from 'react'
import { Route, Link } from 'react-router-dom'
import { Layout, Menu, Icon, Modal, Avatar, Dropdown, Input, Form, message } from 'antd';
import NewDptAndUser from './newDptAndUser/View'
import TagView from './tag/View'
import StoreHouseView from './storehouse/View'
// import ApplyView from './apply/View'
import ApplyView from './apply/ApplyFormView'
import ApproveView from './approve/View'
import svgs from '../assets/svgs';
import { SubMenu } from 'rc-menu';
import ExportStoreView from './exportStore/ExportStoreView';
// import BackStoreView from './backStore/BackStoreView';
import PurchaseStorageView from './purchaseStorage/PurchaseStorageView';
import PurchaseStoreView from './purchaseStore/PurchaseStoreView';
import SelfCenterView from './selfCenter/SelfCenterView';
import PurchasecheckView from './approve/PurchasecheckView';
import ReturnStorageView from './returnStorage/ReturnStorageView';
import ReturncheckView from './approve/ReturncheckView';
import ReturnStoreView from './returnStore/ReturnStoreView';
import SpecialTime from './time/SpecialTime';
import { AppDataContext } from '../redux/AppRedux'
import { userinfo } from '../util/Tool';
import HttpApi from '../http/HttpApi';
const weather = <div id="tp-weather-widget"></div>

// import CamView from './cam/CamView';
const { Header, Content, Sider } = Layout;
export default (props) => {
  const [collapsed, setCollapsed] = useState(false)
  const [iswarehouseManager] = useState(userinfo().permission && userinfo().permission.indexOf('5') !== -1)
  const menu = (
    <Menu onClick={(target) => {
      switch (target.key) {
        case '1':
          props.history.push('/main/setting/selfcenterview')
          break;
        case '2':
          Modal.confirm({
            title: `确认要退出吗？`,
            okText: '确定',
            okType: 'danger',
            onOk: async function () {
              localStorage.removeItem('cname');
              localStorage.removeItem('user');
              props.history.replace('/')
            }
          })
          break;
        default:
          break;
      }
    }}>
      {iswarehouseManager ?
        [<Menu.Item key="x">
          <a href="http://60.174.196.158:12345/subscreen/" rel="noopener noreferrer" target="_blank"><Icon type="desktop" style={{ marginRight: 5, marginTop: 5 }} />
            <span>大屏显示</span>
          </a>
        </Menu.Item>,
        <Menu.Divider key="y" />]
        : null}
      <Menu.Item key="1">
        <Icon type="user" />
        <span>个人中心</span>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="2">
        <Icon type="poweroff" />
        <span>退出登录</span>
      </Menu.Item>
    </Menu>
  );
  useEffect(() => {
    console.log('main useEffect')
  }, [])
  return <Layout>
    <Sider style={styles.side} width='180' trigger={null} collapsible collapsed={collapsed}>
      <div style={styles.logo} >
        <span style={styles.titleIcon}>{svgs.loginTitle(30, 30, '#FFFFFF')}</span>
        <span style={{ ...styles.title, visibility: collapsed ? 'hidden' : 'visible' }}>Welcome</span>
      </div>
      <Menu theme="dark" mode="inline" selectedKeys={[props.location.pathname]} >
        <SubMenu key="库存管理" title={<span><Icon type="reconciliation" /><span>库存</span></span>}>
          <Menu.Item key={'/main/storeview'}>
            <Icon type="hdd" />
            <span className="nav-text">库存列表</span>
            <Link to={`${props.match.url}/storeview`} />
          </Menu.Item>
          <Menu.Item key={'/main/purchasestorageview'}>
            <Icon type="shopping-cart" />
            <span className="nav-text">采购入库单</span>
            <Link to={`${props.match.url}/purchasestorageview`} />
          </Menu.Item>
          <Menu.Item key={'/main/returnstorageview'}>
            <Icon type="shop" />
            <span className="nav-text">退料入库单</span>
            <Link to={`${props.match.url}/returnstorageview`} />
          </Menu.Item>
        </SubMenu>
        <SubMenu key="报表统计" title={<span><Icon type="area-chart" /><span>统计</span></span>}>
          <Menu.Item key={'/main/exportstoreview'}>
            <Icon type="area-chart" />
            <span className="nav-text">出库记录</span>
            <Link to={`${props.match.url}/exportstoreview`} />
          </Menu.Item>
          <Menu.Item key={'/main/purchasetoreview'}>
            <Icon type="area-chart" />
            <span className="nav-text">采购记录</span>
            <Link to={`${props.match.url}/purchasetoreview`} />
          </Menu.Item>
          {/* <Menu.Item key={'/main/backstoreview'}>
            <Icon type="area-chart" />
            <span className="nav-text">退库记录</span>
            <Link to={`${props.match.url}/backstoreview`} />
          </Menu.Item> */}
          <Menu.Item key={'/main/returnstoreview'}>
            <Icon type="area-chart" />
            <span className="nav-text">退料记录</span>
            <Link to={`${props.match.url}/returnstoreview`} />
          </Menu.Item>
        </SubMenu>
        {/* <Menu.Item key="/main/departmentview">
          <Icon type="apartment" />
          <span>部门管理</span>
          <Link to={`${props.match.url}/departmentview`} />
        </Menu.Item> */}
        {/* <Menu.Item key={'/main/userview'}>
          <Icon type="user" />
          <span className="nav-text">用户列表</span>
          <Link to={`${props.match.url}/userview`} />
        </Menu.Item> */}
        <Menu.Item key={'/main/applyview'}>
          <Icon type="form" />
          <span className="nav-text">申请</span>
          <Link to={`${props.match.url}/applyview`} />
        </Menu.Item>
        <SubMenu key={'审批'} title={<span><Icon type="audit" /><span>审批</span></span>}>
          <Menu.Item key={'/main/approve/approveview'}>
            <Icon type="ordered-list" />
            <span className="nav-text">申请单审批</span>
            <Link to={`${props.match.url}/approve/approveview`} />
          </Menu.Item>
          <Menu.Item key={'/main/approve/purchasecheckview'}>
            <Icon type="ordered-list" />
            <span className="nav-text">采购单审计</span>
            <Link to={`${props.match.url}/approve/purchasecheckview`} />
          </Menu.Item>
          <Menu.Item key={'/main/approve/returncheckview'}>
            <Icon type="ordered-list" />
            <span className="nav-text">退料单审计</span>
            <Link to={`${props.match.url}/approve/returncheckview`} />
          </Menu.Item>
        </SubMenu>
        <SubMenu key={'设置'} title={<span><Icon type="setting" /><span>设置</span></span>}>
          {/* <Menu.Item key={'/main/usertag'}>
            <Icon type="tags" />
            <span className="nav-text">用户标签</span>
            <Link to={`${props.match.url}/usertag`} />
          </Menu.Item> */}
          <Menu.Item key={'/main/setting/storetag'}>
            <Icon type="tags" />
            <span className="nav-text">物料属性</span>
            <Link to={`${props.match.url}/setting/storetag`} />
          </Menu.Item>
          <Menu.Item key={'/main/setting/specialtime'}>
            <Icon type="history" />
            <span className="nav-text">时段设置</span>
            <Link to={`${props.match.url}/setting/specialtime`} />
          </Menu.Item>
          <Menu.Item key={'/main/setting/selfcenterview'}>
            <Icon type="user" />
            <span className="nav-text">个人中心</span>
            <Link to={`${props.match.url}/setting/selfcenterview`} />
          </Menu.Item>
        </SubMenu>
        {/* <Menu.Item key={'/main/camview'}>
          <Icon type="tags" />
          <span className="nav-text">摄像头测试</span>
          <Link to={`${props.match.url}/camview`} />
        </Menu.Item> */}
      </Menu>
    </Sider>
    <Layout style={{ marginLeft: collapsed ? 80 : 180 }} >
      <Header style={{ backgroundColor: '#FFF', zIndex: 10, width: '100%', height: 64, padding: 0, borderBottomStyle: 'solid', borderBottomWidth: 1, borderBottomColor: '#e8e8e8', }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <Icon
              style={styles.trigger}
              type={collapsed ? 'menu-unfold' : 'menu-fold'}
              onClick={() => { setCollapsed(!collapsed) }}
            />
            {weather}
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', marginTop: iswarehouseManager ? 24 : 0 }}>
            {iswarehouseManager ? <QrcodeInput {...props} /> : null}
            <Dropdown overlay={menu} trigger={['click']}>
              <Avatar style={{ marginRight: 20, backgroundColor: '#1890ff', cursor: 'pointer' }} shape='square' size={36}>{userinfo().name}</Avatar>
            </Dropdown>
          </div>
        </div>
      </Header>
      <Content style={{ margin: '16px 16px 0', overflow: 'initial', height: '100vh' }}>
        <Route path={`${props.match.url}/departmentview`} component={NewDptAndUser} />
        <Route path={`${props.match.url}/storeview`} component={StoreHouseView} />
        {/* <Route path={`${props.match.url}/userview`} component={UserView} /> */}
        <Route path={`${props.match.url}/applyview`} component={ApplyView} />
        <Route path={`${props.match.url}/approve/approveview`} component={ApproveView} />
        <Route path={`${props.match.url}/approve/purchasecheckview`} component={PurchasecheckView} />
        <Route path={`${props.match.url}/approve/returncheckview`} component={ReturncheckView} />
        <Route path={`${props.match.url}/exportstoreview`} component={ExportStoreView} />
        <Route path={`${props.match.url}/purchasetoreview`} component={PurchaseStoreView} />
        {/* <Route path={`${props.match.url}/backstoreview`} component={BackStoreView} /> */}
        <Route path={`${props.match.url}/purchasestorageview`} component={PurchaseStorageView} />
        <Route path={`${props.match.url}/returnstorageview`} component={ReturnStorageView} />
        <Route path={`${props.match.url}/returnstoreview`} component={ReturnStoreView} />
        <Route path={`${props.match.url}/setting/selfcenterview`} component={SelfCenterView} />
        <Route path={`${props.match.url}/setting/storetag`} component={() => { return <TagView type={0} /> }} />
        <Route path={`${props.match.url}/setting/specialtime`} component={SpecialTime} />

        {/* <Route path={`${props.match.url}/usertag`} component={() => { return <TagView type={1} /> }} /> */}
        {/* <Route path={`${props.match.url}/camview`} component={CamView} /> */}
        {/* <Affix offsetBottom={10}>
          <div style={{ textAlign: 'right' }} >
            <Button icon='to-top' type="primary">top</Button>
          </div>
        </Affix> */}
      </Content>
    </Layout>
  </Layout>
}

const QrcodeInput = Form.create({ name: 'form' })(props => {
  const { appDispatch } = useContext(AppDataContext)
  let timeout;
  return <Form style={{ marginRight: 10 }}>
    <Form.Item>
      {props.form.getFieldDecorator('code', {
        rules: [{ required: false }]
      })(
        <Input style={{ width: 200 }} placeholder={'领料单二维码'} autoFocus allowClear onPressEnter={(e) => {
          if (e.target.value && e.target.value.length === 14) {
            appDispatch({ type: 'currentcode', data: e.target.value })
            props.history.push('/main/approve/approveview')
            let sql = `insert into order_search_list (order_code) VALUES ('${e.target.value}')`
            HttpApi.obs({ sql })
          } else {
            message.error('数值不符合规范')
          }
          if (timeout) { clearTimeout(timeout) }
          timeout = setTimeout(() => {
            props.form.resetFields()
            appDispatch({ type: 'currentcode', data: '' })
          }, 10000)
        }} />
      )}
    </Form.Item>
  </Form>
})

const styles = {
  logo: {
    height: "32px",
    margin: "16px",
  },
  side: {
    overflow: 'auto',
    height: '100vh',
    position: 'fixed',
    left: 0,
  },
  trigger: {
    marginLeft: 10,
    marginRight: 20,
    fontSize: "20px",
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
  icon: {
    marginRight: 0,
    fontSize: 28,
  },
}