# FuYan · Portfolio

一本「可以玩」的个人作品集：首页是 Mae 的夜晚森林小游戏，往下滚走出森林，进入作品与水彩画廊。
静态站点（纯 HTML/CSS/JS，无构建、无后端），部署在 GitHub Pages。

## 目录结构

```
index.html            页面骨架（板块容器）
css/style.css         全部样式（夜晚森林 + 纸张手绘双主题）
js/content.js         ★ 站点内容：项目/旁白/精选图/技能/Formspree ID
js/notes.js           ★ 便签墙数据（上墙就改这里）
js/game.js            首页 Mae 小游戏
js/main.js            渲染与交互（画廊/便签/表单/放大/滚动显现）
assets/mae/           Mae 手绘姿态 PNG（透明底，来自 cats.png 提取）
assets/derived/       派生图（p55 转正；p42/p57 涂官方 Mae；p46/p48/p49 打码）
assets/web/           网页优化图（1600px，列表页用；放大才加载原图）
assets/fonts/         自定义字体（HYG3GJM-sub.woff2 为子集化网页版）
tools/prepare_assets.py  素材处理脚本（可重跑）
```

完整作品入口：导航「全部作品 ↗」指向 GitHub 图床画廊（PDF 不上公网）。

## 本地预览

```bash
python -m http.server 8000
# 打开 http://localhost:8000
```

## 部署（GitHub Pages）

1. GitHub 新建**公开**仓库（如 `Portfolio`）。
2. 把本文件夹内容 push 上去（`.gitignore` 已排除 `排版.indd`、`Portfoliofile/`、`pdf_text.txt`）。
3. 仓库 Settings → Pages → Source 选 `main` / `(root)`。
4. 访问 `https://<用户名>.github.io/<仓库名>/`。

## 开通留言板（Formspree，3 步）

1. 到 <https://formspree.io> 用邮箱注册（免费档 50 条/月够用）。
2. New form 建一个表单，复制 endpoint 里的 ID（形如 `xqkrjyzn`）。
3. 把 ID 填进 `js/content.js` 的 `formspreeId`，push 即可。

留言只发到你的注册邮箱，**页面和代码里都不会出现邮箱**。

## 便签上墙（日常维护）

把想贴的留言发给 agent 说「贴上墙」即可。它会：
1. 在 `js/notes.js` 数组里追加 `{ name, text, color }`（color: y 黄 / b 蓝 / g 绿 / o 橙）；
2. push 发布。

## 其他常见修改

| 要改什么 | 改哪里 |
|---|---|
| 精选图 / 项目旁白 | `js/content.js` 的 `pages` / `narration` |
| 技能条 | `js/content.js` 的 `profile.skills` |
| Mae 姿态图 | 同名覆盖 `assets/mae/` 里的 PNG；新姿态丢进该文件夹并告诉 agent |
| 重新提取素材 | 更新 `cats.png` 后运行 `python tools/prepare_assets.py` |

## 已知事项

- 排版 13/14/18/33/36 因含《林中之夜》官方 Mae 形象未选用（见 PRD.md 版权决策）。
- 排版42 右下角原有一个二维码，如需涂掉找 agent 处理。
