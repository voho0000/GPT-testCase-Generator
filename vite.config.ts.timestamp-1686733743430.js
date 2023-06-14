var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw new Error('Dynamic require of "' + x + '" is not supported');
});

// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { crx } from "@crxjs/vite-plugin";

// manifest.json
var manifest_default = {
  manifest_version: 3,
  name: "GPT test case generator",
  version: "1.0.0",
  description: "Generate test cases using GPT-3.5 Turbo",
  permissions: ["tabs", "storage", "activeTab", "notifications", "contextMenus"],
  host_permissions: ["http://localhost:5000/", "http://127.0.0.1:5000/", "https://35.212.234.39:5000/"],
  options_page: "options.html",
  action: {
    default_popup: "index.html",
    default_icon: {
      "16": "src/assets/icon16.png",
      "48": "src/assets/icon48.png",
      "128": "src/assets/icon128.png"
    },
    default_title: "Vue Popup"
  },
  icons: {
    "16": "src/assets/icon16.png",
    "48": "src/assets/icon48.png",
    "128": "src/assets/icon128.png"
  },
  background: {
    service_worker: "src/background.ts",
    type: "module"
  }
};

// vite.config.ts
var path = __require("path");
var vite_config_default = defineConfig({
  plugins: [
    vue(),
    crx({ manifest: manifest_default })
  ],
  root: path.resolve("/Users/kuoyihsin/My Drive/2\u5DE5\u4F5C/AICS/InDev/GPT-testCase-Generator", "src"),
  resolve: {
    alias: {
      "~bootstrap": path.resolve("/Users/kuoyihsin/My Drive/2\u5DE5\u4F5C/AICS/InDev/GPT-testCase-Generator", "node_modules/bootstrap")
    }
  },
  server: {
    port: 3e3
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcbmltcG9ydCB7IGNyeCB9IGZyb20gJ0Bjcnhqcy92aXRlLXBsdWdpbidcbmltcG9ydCBtYW5pZmVzdCBmcm9tICcuL21hbmlmZXN0Lmpzb24nIGFzc2VydCB7IHR5cGU6ICdqc29uJyB9IC8vIE5vZGUgPj0xN1xuXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5cblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICB2dWUoKSxcbiAgICBjcngoeyBtYW5pZmVzdCB9KSxcbiAgXSxcbiAgcm9vdDogcGF0aC5yZXNvbHZlKFwiL1VzZXJzL2t1b3lpaHNpbi9NeSBEcml2ZS8yXHU1REU1XHU0RjVDL0FJQ1MvSW5EZXYvR1BULXRlc3RDYXNlLUdlbmVyYXRvclwiLCAnc3JjJyksXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ35ib290c3RyYXAnOiBwYXRoLnJlc29sdmUoXCIvVXNlcnMva3VveWloc2luL015IERyaXZlLzJcdTVERTVcdTRGNUMvQUlDUy9JbkRldi9HUFQtdGVzdENhc2UtR2VuZXJhdG9yXCIsICdub2RlX21vZHVsZXMvYm9vdHN0cmFwJyksXG4gICAgfVxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiAzMDAwXG4gIH1cbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7QUFBQSxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFNBQVM7QUFDaEIsU0FBUyxXQUFXOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdwQixJQUFNLE9BQU8sVUFBUTtBQUlyQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsSUFDSixJQUFJLEVBQUUsMkJBQVMsQ0FBQztBQUFBLEVBQ2xCO0FBQUEsRUFDQSxNQUFNLEtBQUssUUFBUSw2RUFBbUUsS0FBSztBQUFBLEVBQzNGLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLGNBQWMsS0FBSyxRQUFRLDZFQUFtRSx3QkFBd0I7QUFBQSxJQUN4SDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
