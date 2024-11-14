import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import App from "./App.vue";
import FloatingVue from 'floating-vue'
import { library, dom } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

import "./style.css";
import "./assets/scss/index.scss";
import 'floating-vue/dist/style.css';
import { faPlus, faTimes, faPlug, faSpinner, faRocket, faPowerOff, faSignalPerfect, faTimesCircle, faDownload, faQuestionCircle, faObjectUngroup, faObjectGroup, faAddressCard } from '@fortawesome/free-solid-svg-icons'


const pinia = createPinia();
const app = createApp(App);

library.add(faPlus, faTimes, faPlug, faSpinner, faRocket, faPowerOff, faSignalPerfect, faTimesCircle, faDownload, faQuestionCircle, faObjectUngroup, faObjectGroup, faAddressCard);
app.component("font-awesome-icon", FontAwesomeIcon);
dom.watch();

app.use(pinia);
app.use(router);
app.use(FloatingVue);

app.mount("#app");


