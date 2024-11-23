import { createRouter, createWebHashHistory } from "vue-router";
import DashboardPage from "../pages/DashboardPage.vue";
import LoginPage from "../pages/LoginPage.vue";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "Login",
      component: LoginPage,
    },
    {
      path: "/dashboard",
      name: "Dashboard",
      component: DashboardPage,
    },
  ],
});

export default router;
