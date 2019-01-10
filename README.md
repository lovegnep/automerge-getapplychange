# 是什么
基于automerge的协同编辑demo，编辑器采用slate。
Automberge的Connection是一个黑盒，没有完全搞懂，所有用了最简单的getChanges与applyChange来实现协同

# 功能
1. 多端协同编辑
2. 离线再上线会同步最新状态

# 各个分支的差别
1. master分支提供基本的协同编辑，不考虑断线重连的情况
2. offline分支提供基本的协同编辑，并仿真断线重连的情况，不是真正的断线重连
3. realoffline分支提供基本的协同编辑，并考虑断线重连的情况，是真正的断线重连


# 怎样使用

### 先拉取分支并切换到offline分支
1. git clone  https://github.com/lovegnep/automerge-getapplychange.git
2. git checkout offline
### 安装依赖
npm install

### 启动服务端
1. cd src
2. node server.js

### 启动客户端
npm start
