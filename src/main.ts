import Vue from 'vue';
import VueRouter from 'vue-router';

// import gd from './components/PluginGD.vue';
// import arc from './components/PluginTest.vue';
// import arc3d from './components/PluginTest3D.vue';
import bd from './components/PluginBD.vue';
import pgis from './components/PluginPGIS_LS.vue';
import App from './App.vue';
import GisViewer from './plugin/index';

Vue.config.productionTip = false;
Vue.use(GisViewer);

Vue.use(VueRouter);
//定义路由
const routes = [
  {path: '', component: pgis},
  // {path: '/gd', component: gd},
  // {path: '/arc', component: arc},
  // {path: '/arc3d', component: arc3d},
  {path: '/bd', component: bd},
  {path: '/pgis', component: pgis}
];

//创建 router 实例，然后传 routes 配置
const router = new VueRouter({
  // mode: 'history',
  routes: routes
});


new Vue({
  router: router,
  render: (h) => h(App)
}).$mount('#app');
