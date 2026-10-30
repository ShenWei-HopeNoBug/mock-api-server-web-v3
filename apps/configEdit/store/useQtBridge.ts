import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { QtSdkType } from '#/qtSdk';

const useQtBridgeStore = defineStore('qtBridge', () => {
  const register = ref<boolean>(false);
  const channelObj = ref<Record<string, QtSdkType.Bridge> | null>(null);

  const setRegister = (bool: boolean): void => {
    register.value = bool;
  };

  const setChannelObj = (obj: Record<string, QtSdkType.Bridge> | null): void => {
    channelObj.value = obj;
  };

  return { register, channelObj, setRegister, setChannelObj };
});

export { useQtBridgeStore };
