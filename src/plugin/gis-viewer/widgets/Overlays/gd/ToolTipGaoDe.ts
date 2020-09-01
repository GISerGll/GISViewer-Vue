import { Vue } from "vue-property-decorator";

export default class ToolTip {
    public id: string = "tooltip_gaode2d";
    private view!: AMap.Map;
    private vm!: Vue;
    private postion!: any;

    public constructor(view: AMap.Map, tooltip:Vue.Component, content: Object, position: any) {
        this.view = view;
        this.postion = position;
        this.create(tooltip,content);
    }
    private create(tooltip:Vue.Component, props: Object) {
        this.vm = new Vue({
            // 为什么不使用 template 要使用render 因为现在是webpack里面没有编译器 只能使用render
            render: h => h(tooltip, { props }) // render 生成虚拟dom  {props: props}
        }).$mount(); // $mount 生成真实dom, 挂载dom 挂载在哪里, 不传参的时候只生成不挂载，需要手动挂载

        let gdContainer = this.view.getContainer();
        gdContainer.appendChild(this.vm.$el);

        this.changeText();
        this.init();
    }
    //计算tooltip，偏移位置；
    private subLocate(location: string): { xoffset: number; yoffset: number } {
        let xoffset: number = 0;
        let yoffset: number = 0;
        const width = this.vm.$el.clientWidth;
        const height = this.vm.$el.clientHeight;
        switch (location) {
            case "top":
                xoffset = 0 - width / 2 - 10;
                yoffset = 0 - height - 10;
        }
        return { xoffset: xoffset, yoffset: yoffset };
    }
    private init() {
        this.view.on('movestart', e => {
            this.changeText();
        });
        this.view.on('mapmove', e => {
            this.changeText();
        });
        this.view.on('moveend', e => {
            this.changeText();
        });
    }
    private changeText() {
        let point = this.view.lngLatToContainer(this.postion);
        const offset: { xoffset: number; yoffset: number } = this.subLocate("top");
        Object(this.vm.$el).style.left = point.x + 10 + offset.xoffset + "px";
        Object(this.vm.$el).style.top = point.y + offset.yoffset + "px";
    }
    public remove() {
        // 回收组件
        this.view.getContainer().removeChild(this.vm.$el); // 删除元素
        this.vm.$destroy(); // 销毁组件
        //取消监听事件
        this.view.off('movestart', e => {
            this.changeText();
        });
        this.view.off('mapmove', e => {
            this.changeText();
        });
        this.view.off('moveend', e => {
            this.changeText();
        });
    }
}
