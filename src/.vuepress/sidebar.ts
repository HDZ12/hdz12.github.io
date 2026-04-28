import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    "",
    "/intro",
  ],

  "/demo/": [
    {
      text: "JAVA",
      icon: "mug-hot",
      prefix: "/demo/JAVA/",
      link: "",
      collapsible: true,
      expanded: false,
      children: ["java概述","基础语法","面向对象","String","Integer","Object"],
    },
    {
      text: "Algorithm",
      icon: "calculator",
      prefix: "/demo/Algorithm/",
      link: "",
      collapsible: true,
      expanded: false,
      children: [
        {
          text: "贪心算法",
          icon: "lightbulb",
          prefix: "贪心算法/",
          link: "",
          collapsible: true,
          expanded: false,
          children: ["理论","分发饼干","摆动序列","最大子数组","买卖股票的最佳时机Ⅱ","跳跃游戏","跳跃游戏Ⅱ"],
        },
      ],
    },
    {
      text: "Agent",
      icon: "robot",
      prefix: "/demo/Agent/",
      link: "",
      collapsible: true,
      expanded: false,
      children: ["tool"],
    },
    {
      text: "Tool",
      icon: "carbon:tool-kit",
      prefix: "/demo/Tool/",
      link: "",
      collapsible: true,
      expanded: false,
      children: ["git"],
    },
    // "/intro",
  ],

  "/project/": [
    {
      text: "paicli",
      icon: "diagram-project",
      link: "/project/",
    },
  ],
});
