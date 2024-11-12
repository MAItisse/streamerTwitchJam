import { createRouter, createWebHashHistory } from "vue-router";
import DashboardPage from "../pages/DashboardPage.vue";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "Home",
      component: DashboardPage,
    },
  ],
});

export default router;
