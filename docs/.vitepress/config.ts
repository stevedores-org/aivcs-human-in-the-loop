import { defineConfig } from "vitepress"

export default defineConfig({
  title: "AIVCS",
  description: "Advance AI Version Control",
  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Roadmap", link: "/ROADMAP" },
      { text: "SSO", link: "/SSO" }
    ],
    sidebar: [
      {
        text: "Documentation",
        items: [
          { text: "Roadmap", link: "/ROADMAP" },
          { text: "SSO", link: "/SSO" }
        ]
      }
    ]
  }
})
