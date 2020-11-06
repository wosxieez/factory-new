import React, { useState, useContext, useEffect } from 'react'
import { Route, Link } from 'react-router-dom'
import { Layout, Menu, Icon, Modal, Avatar, Dropdown, Input, Form, message, Badge } from 'antd';
import NewDptAndUser from './newDptAndUser/View'
import TagView from './tag/View'
import StoreHouseView from './storehouse/View'
// import ApplyView from './apply/View'
import ApplyView from './apply/ApplyFormView'
import ApproveView, { checkStatusSql, getOrderCount, statusOptions } from './approve/View'
import svgs from '../assets/svgs';
import { SubMenu } from 'rc-menu';
import ExportStoreView from './exportStore/ExportStoreView';
// import BackStoreView from './backStore/BackStoreView';
import PurchaseStorageView from './purchaseStorage/PurchaseStorageView';
import PurchaseStoreView from './purchaseStore/PurchaseStoreView';
import SelfCenterView from './selfCenter/SelfCenterView';
import PurchasecheckView, { getCountCG } from './approve/PurchasecheckView';
import ReturnStorageView from './returnStorage/ReturnStorageView';
import ReturncheckView, { getCountRT } from './approve/ReturncheckView';
import ReturnStoreView from './returnStore/ReturnStoreView';
import SpecialTime from './time/SpecialTime';
import { AppDataContext } from '../redux/AppRedux'
import { userinfo } from '../util/Tool';
import HttpApi from '../http/HttpApi';
import moment from 'moment'
import { useCallback } from 'react';
const weather = <div id="tp-weather-widget"></div>
const FORMAT = 'YYYY-MM-DD HH:mm:ss'
// import CamView from './cam/CamView';
const { Header, Content, Sider } = Layout;
export default (props) => {
  ///权限。0专工,1运行,2消费审批(财务),3维修权限,4采购权限,5库管,6仓库财务
  const { appState, appDispatch } = useContext(AppDataContext)
  const [collapsed, setCollapsed] = useState(false)
  const [hasPermission0] = useState(userinfo().permission && userinfo().permission.split(',').indexOf('0') !== -1)
  // const [hasPermission1] = useState(userinfo().permission && userinfo().permission.split(',').indexOf('1') !== -1)
  // const [hasPermission2] = useState(userinfo().permission && userinfo().permission.split(',').indexOf('2') !== -1)
  // const [hasPermission3] = useState(userinfo().permission && userinfo().permission.split(',').indexOf('3') !== -1)
  const [hasPermission4] = useState(userinfo().permission && userinfo().permission.split(',').indexOf('4') !== -1)
  const [hasPermission5] = useState(userinfo().permission && userinfo().permission.split(',').indexOf('5') !== -1)
  const [hasPermission6] = useState(userinfo().permission && userinfo().permission.split(',').indexOf('6') !== -1)

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
      {hasPermission5 ?
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
  const doSomething = useCallback(async () => {
    ///审批部分 有相关权限才会显示，如果只是维修就不会显示count
    let startOfM = moment().startOf('month').format(FORMAT)
    let endOfD = moment().endOf('day').format(FORMAT)
    if (hasPermission0 || hasPermission4 || hasPermission5 || hasPermission6) {
      let allCondition = {};
      let copyStatusOptions = JSON.parse(JSON.stringify(statusOptions));
      let afterFilter = copyStatusOptions.filter((item) => { return userinfo().permission.split(',').indexOf(String(item.permission)) !== -1 })
      let major_list = userinfo().major_id_all ? userinfo().major_id_all.split(',').map((item) => parseInt(item)) : []///设置固定的专业
      allCondition.status_list = afterFilter
      allCondition.major_list = major_list
      let major_sql = major_list.length > 0 ? ` and orders.tag_id in (${allCondition.major_list.join(',')})` : ''
      let date_sql = ` and orders.createdAt>'${startOfM}' and orders.createdAt<'${endOfD}'`
      let condition_sql = date_sql + major_sql + checkStatusSql(allCondition.status_list);
      let result_count = await getOrderCount(condition_sql)
      appDispatch({ type: 'approvecount', data: result_count })
    }
    if (hasPermission6) {
      ////采购单记录
      let sql_date_cg = ` and date >= '${startOfM}' and date <= '${endOfD}'`
      let sql_check_status_cg = ' and check_status in (0)'
      let sql_cg = sql_date_cg + sql_check_status_cg
      let result_count_cg = await getCountCG(sql_cg)
      appDispatch({ type: 'purchasecount', data: result_count_cg })
      ////退料单记录
      let sql_date_tl = ` and date >= '${startOfM}' and date <= '${endOfD}'`
      let sql_check_status_tl = ' and check_status in (0)'
      let sql_tl = sql_date_tl + sql_check_status_tl
      let result_count_tl = await getCountRT(sql_tl)
      appDispatch({ type: 'returncount', data: result_count_tl })
    }
  }, [appDispatch, hasPermission0, hasPermission4, hasPermission5, hasPermission6])
  useEffect(() => {
    console.log('main useEffect')
    doSomething()
  }, [doSomething])
  return <Layout>
    <Sider style={styles.side} width={180} trigger={null} collapsible collapsed={collapsed}>
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
        <SubMenu key={'审批'} title={
          <span><Icon type="audit" />
            <span>审批</span>
            <Badge style={styles.titleIcon} dot={appState.approvecount + appState.purchasecount + appState.returncount > 0} />
          </span>}>
          <Menu.Item key={'/main/approve/approveview'}>
            <Icon type="ordered-list" />
            <span className="nav-text">申请审批</span>
            <Badge style={styles.titleIcon} count={appState.approvecount} overflowCount={99} />
            <Link to={`${props.match.url}/approve/approveview`} />
          </Menu.Item>
          <Menu.Item key={'/main/approve/purchasecheckview'}>
            <Icon type="ordered-list" />
            <span className="nav-text">采购审计</span>
            <Badge style={styles.titleIcon} count={appState.purchasecount} overflowCount={99} />
            <Link to={`${props.match.url}/approve/purchasecheckview`} />
          </Menu.Item>
          <Menu.Item key={'/main/approve/returncheckview'}>
            <Icon type="ordered-list" />
            <span className="nav-text">退料审计</span>
            <Badge style={styles.titleIcon} count={appState.returncount} overflowCount={99} />
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
          <div style={{ display: 'flex', flexDirection: 'row', marginTop: hasPermission5 ? 24 : 0 }}>
            {hasPermission5 ? <QrcodeInput {...props} /> : null}
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
            let sql = `insert into order_search_list (order_code,time) VALUES ('${e.target.value}','${moment().format('YYYY-MM-DD HH:mm:ss')}')`
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