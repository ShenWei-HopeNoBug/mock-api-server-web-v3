import { onBeforeMount, onBeforeUnmount, ref } from 'vue';

const TWO_PART_COL = 12;
const THREE_PART_COL = 8;
const FOUR_PART_COL = 6;

const useSearchFormResize = () => {
  const searchFormItemColRef = ref<number>(THREE_PART_COL);

  const onWindowResize = () => {
    const smallWidth = 1440;
    const largeWidth = 2560;
    if (window.innerWidth <= smallWidth) {
      searchFormItemColRef.value = TWO_PART_COL;
    } else if (window.innerWidth < largeWidth) {
      searchFormItemColRef.value = THREE_PART_COL;
    } else {
      searchFormItemColRef.value = FOUR_PART_COL;
    }
  };

  onBeforeUnmount(() => {
    onWindowResize();
    window.removeEventListener('resize', onWindowResize);
  });

  onBeforeMount(() => {
    window.addEventListener('resize', onWindowResize);
  });

  return {
    searchFormItemColRef,
  };
};

export default useSearchFormResize;
