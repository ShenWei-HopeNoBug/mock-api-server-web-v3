<template>
  <div class="mock-tester">
    <h2>Mock 接口测试</h2>
    <div class="content">
      <MockRequestTester :option="freedomTester" :deviceId="deviceId" />
      <a-card title="预置接口测试" class="tester-card">
        <template #extra>
          <div class="extra-actions">
            <a-button @click="onBatchCollapse">一键收起</a-button>
            <a-button @click="onBatchExpand">一键展开</a-button>
            <a-button type="primary" @click="onBatchSend">一键测试</a-button>
          </div>
        </template>
        <MockRequestTester
          v-for="(config, i) in testerList"
          :key="`tester-${i}`"
          :ref="el => setTesterRef(el, i)"
          :option="config"
        />
      </a-card>
    </div>
  </div>
</template>

<script lang="ts" setup name="mockTester">
import { ref } from 'vue';
import MockRequestTester from './components/MockRequestTester/index.vue';
import { freedomTester, testerList } from './config';
import { generateUUID } from '@/utils';

const deviceId = generateUUID();

const testerRefs = ref<InstanceType<typeof MockRequestTester>[]>([]);

const setTesterRef = (el: any, index: number) => {
  if (el) {
    testerRefs.value[index] = el;
  }
};

const onBatchSend = () => {
  testerRefs.value.forEach(tester => tester?.send?.());
};

const onBatchExpand = () => {
  testerRefs.value.forEach(tester => tester?.expand?.());
};

const onBatchCollapse = () => {
  testerRefs.value.forEach(tester => tester?.collapse?.());
};
</script>

<style scoped lang="scss">
.mock-tester {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 16px;

  .content {
    flex: 1;
    width: 100%;
    height: 100%;
    overflow: hidden;
    overflow-y: auto;
    scrollbar-gutter: stable;
    padding: 24px 16px 24px 24px;
    border-radius: 8px;
    border: 1px solid #ccc;
    background-color: #fafafa;
  }

  .extra-actions {
    display: flex;
    gap: 8px;
  }
}
</style>
