import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    "",
    "/intro",
    // {
    //   text: "需求笔记",
    //   icon: "laptop-code",
    //   link: "/demo/",
    // },
    // {
    //   text: "代码笔记",
    //   icon: "book",
    //   link: "/project/",
    // },
    // {
    //   text: "文章",
    //   icon: "pen-to-square",
    //   link: "/posts/",
    // },
  ],

  "/demo/": [
    {
      text: "Java基础",
      icon: "laptop-code",
      prefix: "/demo/",
      link: "/demo/",
      children: ["layout"],
    },
  ],

  "/project/": [
    {
      text: "paicli",
      icon: "book",
      link: "/project/",
    },
  ],
});
