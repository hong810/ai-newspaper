# AI 情报报纸（本地）

本地运行的 AI 报纸项目：`index.html` 由 `server.js`（Node.js）托管，并内置一个仅监听 `127.0.0.1` 的代理，用于抓取无 CORS 限制的海外 RSS / arXiv 等资源。

## 启动

方式一（推荐）：双击 `启动报纸.bat`

方式二（手动）：

```
node server.js
```

然后浏览器打开 http://127.0.0.1:8765/

## 说明

- 服务仅监听本机 127.0.0.1:8765，不对外网开放。
- 端口被占用时脚本会自动沿用现有服务（不重复启动）。
- 依赖：Node.js。`启动报纸.bat` 会自动回退到 `D:\ai\node.js\node.exe`。

## 文件

- `index.html` —— 报纸页面
- `server.js` —— 本地静态服务 + RSS/arXiv 代理
- `启动报纸.bat` —— Windows 一键启动
