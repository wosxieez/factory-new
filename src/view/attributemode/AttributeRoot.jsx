import { Tabs } from 'antd'
import React from 'react'
import StoreAreaView from './StoreAreaView';
import StoreMajorView from './StoreMajorView';
import StoreSupplierView from './StoreSupplierView';
import StoreTypeView from './StoreTypeView';
const { TabPane } = Tabs;

export default function AttributeRoot() {
    return (
        <Tabs style={{ backgroundColor: '#ffffff' }} defaultActiveKey="1" >
            <TabPane tab="区域设置" key="1">
                <StoreAreaView />
            </TabPane>
            <TabPane tab="类型设置" key="2">
                <StoreTypeView />
            </TabPane>
            <TabPane tab="专业设置" key="3">
                <StoreMajorView />
            </TabPane>
            <TabPane tab="供应商设置" key="4">
                <StoreSupplierView />
            </TabPane>
        </Tabs >
    )
}
