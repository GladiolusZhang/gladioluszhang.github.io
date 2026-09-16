# 以后怎么更新这个主页

## ⚠️ 先看这一条

**这个仓库是 Hexo 生成出来的静态产物，不是源码。**

```
hexo 源码  --[hexo generate]-->  这个仓库（HTML）  --[git push]-->  GitHub Pages
```

意思是：你现在看到的 `index.html`、`about/index.html` 这些都是**生成结果**。
直接改它们、push，网站会立刻更新，**这样是有效的**。

但如果你哪天在**源码仓库**里跑一次 `hexo generate` 再推上来，
这次改的所有东西（新首页、新样式、访客地图）**会被覆盖掉**。

所以两条路，选一条并坚持下去：

| 你手上有什么 | 建议做法 |
| --- | --- |
| **只有这个仓库**（多数情况） | 直接改这里的 HTML，往下看「方式一/二」 |
| **还有 Hexo 源码** | 把改动搬回源码（`source/`、`themes/`），以后只从源码生成 |

如果源码还在，告诉我，我帮你把这一整套改动搬过去，那样才是长久之计。

---

## 方式一：改几个字（不用装任何东西）

适合改邮箱、改一句话、改个链接。

1. 打开 https://github.com/GladiolusZhang/gladioluszhang.github.io
2. 找到要改的文件（比如首页就是根目录的 `index.html`）
3. 点右上角铅笔图标 ✏️ 编辑
4. 改完拉到底，点 **Commit changes**
5. 等 1～2 分钟，GitHub Pages 自动重新部署，刷新网站就能看到

## 方式二：本地改（推荐，改得多的时候）

```bash
git clone https://github.com/GladiolusZhang/gladioluszhang.github.io.git
cd gladioluszhang.github.io

# 本地预览：起一个服务器，浏览器打开 http://127.0.0.1:8123
python -m http.server 8123
# （用仓库里 tools/serve.py 更好，它会强制 UTF-8，中文不会乱码）

# 改完之后
git add -A
git commit -m "update homepage"
git push
```

> 这个仓库里的 `tools/` 目录是我放的辅助脚本，**部署时用不到**，但留着方便以后批量改。
> 不想要的话可以直接删掉，不影响网站。

---

## 常见修改对照表

想改什么，就编辑哪个文件的哪一段：

| 想改的东西 | 文件 | 找什么 |
| --- | --- | --- |
| 首页所有内容（简介/论文/项目/荣誉…） | `index.html` | 每个段落都有 `<!-- ===== 标题 ===== -->` 注释 |
| 邮箱 | `index.html` + `about/index.html` | 搜 `zhangshuyu`（注意：**故意写成 `[AT]` 不带 @**，防爬虫，别改回去） |
| 个人照片 | 覆盖 `images/profile.jpg` 即可 | 建议 4:5 竖版，480×600 左右 |
| 论文列表 | `index.html` | 搜 `site-paper`，每篇一个 `<div class="site-paper">` |
| 导师主页链接 | `index.html` + `about/index.html` | 搜 `web.xidian.edu.cn` |
| 全站页脚链接 | **所有** HTML | 搜 `site-footer-links` |
| 配色 / 字体 / 间距 | `css/site.css` | 顶部 `:root` 里是颜色变量 |
| 访客统计开关 | `js/visitor-config.js` | 见 `docs/visitor-setup.md` |
| 项目卡片 | `index.html` | 平时不用管，`js/projects.js` 会自动从 GitHub 拉 |

### 改页脚要小心

页脚（`<footer class="site-footer">`）出现在**每一个**页面上。
如果你只改了首页，其他页面还是旧的。

批量改可以写个脚本，或者用编辑器的「在文件夹中替换」。
仓库里 `tools/` 下有几个我写过的批量脚本可以参考。

---

## 新增一篇笔记

笔记是从 Hexo 生成的，**直接在这个仓库里加比较麻烦**（要同时建目录、改归档列表、改 RSS、改 sitemap）。

如果以后要经常写笔记，强烈建议把 Hexo 源码找回来，在源码里写 Markdown 然后生成。
只偶尔写的话，可以告诉我，我帮你在这个仓库里手动加。

---

## 访客统计

现在还没接数据库，页面上显示的是演示数据。要让它变成真的：

看 `docs/visitor-setup.md`，一共 4 步，大概 5 分钟：

1. 注册 Supabase（免费，不用自己的服务器）
2. 建一张表（SQL 直接复制粘贴）
3. 复制两个值填进 `js/visitor-config.js`
4. push

**你需要注册的只有 Supabase 这一个。** 其他什么都不用注册。

---

## 改完怎么确认没坏

```bash
# 所有页面是否都能打开（应该全是 200）
for p in $(find . -name "*.html" -not -path "./.git/*"); do
  echo "$p"; done

# 最省事的办法：本地起服务器，把首页、/about、/visits、随便一篇笔记都点一遍
```

重点看三处容易出错的地方：

- **HTML 标签有没有配错**（少个 `</div>` 会让后面整段排版乱掉）
- **链接有没有写错**（相对路径 `/images/xxx` 是相对网站根目录的）
- **feed / sitemap**：`atom.xml`、`sitemap.xml` 改了之后要确认还是合法 XML
  （用浏览器直接打开，报错就说明坏了）
