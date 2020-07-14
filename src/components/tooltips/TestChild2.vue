<template>
    <div class="lightingTreePop">
        <p class="title">路灯信息</p>
        <p class="fa fa-close"></p>
        <ul class="main">
            <li>
                <p>上海电科只能系统股份有限公司</p>
                <div>成都雄飞中心</div>
            </li>
        </ul>
    </div>
</template>

<script>
    export default {
        name: "TestChild2.vue",
        components:{
        }
    }
</script>

<style scoped>
    *,
    p,
    ul,
    ul li {
        padding: 0;
        margin: 0;
        font-family: 微软雅黑;
        font-size: 14px;
        list-style: none;
    }

    .lightingTreePop{
        width: 300px;
        position: absolute;
        top: 10%;
        left: 50%;
        /*transform: translate(-50%, 0);*/
        background: #f8fbfe;
        border-radius: 4px;
        box-shadow: 0 0 1px 1px rgba(53,73,102,0.08);
    }
    .lightingTreePop .fa-close{
        position: absolute;
        top: 10px;
        right: 10px;
        cursor: pointer;
        color: #7d98bf;
    }
    .lightingTreePop .main{
        width: 100%;
        margin: 20px auto 0;
    }
    .lightingTreePop .title{
        width: 100%;
        height: 30px;
        line-height: 30px;
        text-align: center;
        position: relative;
        color: #fff;
        background: url("../../assets/img_gis_tc_ldxx.png") no-repeat center center;
        position: absolute;
        top: -15px;
        left: 0;
    }

</style>