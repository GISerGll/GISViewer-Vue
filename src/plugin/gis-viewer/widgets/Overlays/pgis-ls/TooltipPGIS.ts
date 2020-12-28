import { Vue } from "vue-property-decorator";
import {loadModules} from 'esri-loader';

declare let ol:any
export default class TooltipPGIS {
  public id: string = "tooltip_pgisls";
  private view!: any;
  private vm!: Vue;
  private overlay: any;

  public constructor(tooltipObj:any) {
    const {view,component,props,position,picSize} = tooltipObj;
    this.view = view;
    this.create(component,props,position,picSize);
  }
  private create(tooltip:Vue.Component, props:Object, position:number[],picSize:number[]) {
    this.vm = new Vue({
      // 为什么不使用 template 要使用render 因为现在是webpack里面没有编译器 只能使用render
      render: h => h(tooltip, { props }) // render 生成虚拟dom  {props: props}
    }).$mount(); // $mount 生成真实dom, 挂载dom 挂载在哪里, 不传参的时候只生成不挂载，需要手动挂载

    const overlay = new ol.Overlay({
      element: this.vm.$el,       // 将自己写的 html 内容添加到覆盖层，html 内容略
      autoPan: true,             // 是否自动平移，当点击时对话框超出屏幕边距，会自动平移地图使其可见
      className: 'gis-overlay'           // 覆盖物在覆盖层的类名
    })

    overlay.setPosition(position)
    this.view.addOverlay(overlay)

    const width = this.vm.$el.clientWidth;
    const height = this.vm.$el.clientHeight;
    if(picSize && picSize.length){
      overlay.setOffset([-width/2,-(height + 1/2 * picSize[1])+5])
    }else {
      overlay.setOffset([-width/2,-(height + 20)])
    }

    this.overlay = overlay;
  }
  public remove() {
    // 回收组件
    this.view.removeOverlay(this.overlay); // 删除元素
    this.vm.$destroy(); // 销毁组件
  }
  public hide() {
    this.overlay.getElement().style.display = "none";
  }
}
