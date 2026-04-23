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
      children: ["集合"],
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
          children: ["理论"],
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
      children: ["React"],
    },
  ],

  "/project/": [
    {
      text: "paicli",
      icon: "diagram-project",
      link: "/project/",
    },
  ],
});
