# 页面

此文件存放结构遵循路由结构划分，[遵循 nextjs 规范]()

如 `http://localhost:3000/path-1/path-2`，那么应该创建 `path-1/path-2` 的文件夹，如果

|                    路由                    |               文件                |
| :----------------------------------------: | :-------------------------------: |
|        http://localhost:3000/path-1        |       `src/path-1/page.tsx`       |
|     http://localhost:3000/path-2/list      |    `src/path-2/list/page.tsx`     |
| http://localhost:3000/path-2/detail/${id}  | `src/path-2/detail/[id]/page.tsx` |
|  http://localhost:3000/path-2/edit/${id}   |  `src/path-2/edit/[id]/page.tsx`  |
| http://localhost:3000/path-3/${id}/path-4/ | `src/path-3/[id]/path-4/page.tsx` |
