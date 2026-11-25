# 缇久年昔的个人博客

第一版是 Astro 静态站，包含首页、学习、音乐和游戏。页面和资源在构建时生成，不需要数据库、后端服务或原参考博客的发布配置。

## 在本机预览

需要 Node.js 24 和 npm。在本目录执行：

```powershell
npm ci
npm run dev
```

打开终端打印的本地地址。用 `npm run check` 做类型检查，`npm test` 跑单元测试，`npm run build` 生成 `dist/`，再用 `npm run preview` 核对产物。生成产物不等于发布；域名、服务器和发布流程后续再定。

## 写一篇文章

- 学习文章放在 `src/content/learning/`，对应 `/learning/`。
- 游玩感想放在 `src/content/game-notes/`，对应游戏页「游玩感想」。它不挂在某个游戏封面下，也不会出现在学习目录。

两个目录的 Markdown 用相同的格式。建议使用小写英文和短横线作为文件名；例如 `hello-astro.md` 会生成 `hello-astro` 详情链接。避免在文章对外使用后随意改名。

```markdown
---
title: "文章标题"
published: 2026-11-25
description: "一句简短的介绍，可不写"
draft: false
---

这里开始写正文。

## 小标题

- 第一条笔记
- 第二条笔记
```

目录会按发布日期从新到旧排列。设为 `draft: true` 后既不出现在目录，也不会生成详情页。文章图片可放在 `public/media/articles/`，正文引用 `/media/articles/文件名`，不需要改页面组件。如果新增文件后开发预览没有刷新目录，重启 `npm run dev` 即可重新加载内容。

## 增加一首歌

把有权使用的音频放在 `public/media/music/`，然后在 `src/data/music.json` 数组里添加一项，展示顺序以此数组为准：

```json
{ "title": "歌名", "artist": "歌手或来源", "src": "/media/music/my-song.mp3", "cover": "/media/music/my-cover.webp" }
```

`cover` 可以不填。也可使用有公开播放授权、能直接访问的音频 URL；音乐网页的页面地址不能作为音频地址。当前两段自制短旋律只供功能测试，不是正式收藏；删除歌单里的两项即可移除展示。两份静态 WAV 已在 `public/media/music/`，日常开发不需要重新生成；`npm run demo:audio` 仅用于重做这两份示例文件。空歌单使用 `[]`。

## 修改游戏海报

把有权使用的竖版封面放进 `public/media/games/`，在 `src/data/games.json` 对应数组里加一条：

```json
{
  "demo": false,
  "recent": [{ "name": "游戏名称", "cover": "/media/games/game-cover.webp" }],
  "favorites": []
}
```

`recent` 是最近在玩，`favorites` 是最喜欢的游戏，两栏互不关联。建议封面比例 2:3。替换掉演示名单和海报后，把 `demo` 改为 `false`。当前封面是自制示意图，不是游戏官方海报。
