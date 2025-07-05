/* eslint-disable check-file/filename-naming-convention */
import type { JSX } from 'react';
import { RouterProvider } from 'react-router-dom';

// React 19 兼容问题: https://ant.design/docs/react/v5-for-19-cn
import '@ant-design/v5-patch-for-react-19';
import { ConfigProvider } from 'antd';
import locale from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import router from './routes';

import './App.css';

dayjs.locale('zh-cn');

function App(): JSX.Element {
  return (
    <>
      <ConfigProvider
        locale={locale}
        theme={{
          token: {
            // Seed Token，影响范围大
            // colorPrimary: '#ee4d2d',
            colorPrimary: '#1677ff',
          },
        }}
      >
        <RouterProvider router={router} fallbackElement={<p>Initial Load...</p>} />
      </ConfigProvider>
    </>
  );
}

export default App;
