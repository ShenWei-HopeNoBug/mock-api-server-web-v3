<template>
  <Spin class="carousel-video" :spinning="loadingRef" tip="" :z-index="1" :mask-style="maskStyle">
    <video
      v-show="currentVideo"
      ref="videoRef"
      :style="videoStyle"
      :data-key="currentVideo?.key"
      :src="currentVideo?.video_url"
      :muted="muted"
      :controls="false"
      :loop="false"
      :autoplay="false"
      :playsinline="true"
      crossorigin="anonymous"
      preload="auto"
      webkit-playsinline="true"
      x5-playsinline="true"
      x-webkit-airplay="allow"
      x5-video-player-type="h5-page"
      x5-video-player-fullscreen="false"
      v-on="videoEventMap"
    />
    <div
      v-if="currentVideo?.poster_url"
      v-show="currentVideo && posterVisible"
      :key="currentVideo?.key"
      class="poster-overlay"
      :style="{ backgroundImage: `url('${currentVideo?.poster_url}')` }"
    />
  </Spin>
</template>

<script lang="ts" setup name="CarouselVideo">
import { ref, watch, onMounted, onBeforeUnmount, nextTick, CSSProperties } from 'vue';
import { cloneDeep } from 'lodash-es';
import hashSum from 'hash-sum';
import { generateUUID } from '@/utils';
import Spin from '@/components/Spin/index.vue';
import { CarouselVideoManager } from './CarouselVideoManager';
import type { CarouselVideoType } from './type';

/** 视频最大重试次数，超过后轮播时跳过该视频 */
const MAX_RETRY = 3;
/** readyState >= 3（HAVE_FUTURE_DATA）表示已有足够数据可以播放 */
const CAN_PLAY_CODE = 3;

const maskStyle = {
  backgroundColor: 'transparent',
};

interface Props {
  /** 视频列表，支持运行时动态更新 */
  videos?: CarouselVideoType.VideoItem[];
  /** 是否静音播放 */
  muted?: boolean;
  /** 是否在 videos 变化时立即更新播放列表（true: 立即切换; false: 等当前视频播放结束后再生效） */
  immediateUpdate?: boolean;
  /** 视频元素样式，用于自定义视频播放器的外观 */
  videoStyle?: CSSProperties;
  /** 是否启用离开时历史播放恢复（mount 时从 Manager 恢复，unmount 时保存到 Manager） */
  restoreHistory?: boolean;
  /** loading 超时阈值（ms），超过后触发 loadingTimeout 事件；0 表示不启用 */
  loadingTimeout?: number;
}

const props = withDefaults(defineProps<Props>(), {
  videos: () => [],
  muted: true,
  immediateUpdate: false,
  restoreHistory: true,
  loadingTimeout: 30000,
});

const emits = defineEmits<{
  /** 所有视频加载失败时触发，携带当前 activeVideos 数据 */
  (e: 'allVideosError', videos: CarouselVideoType.VideoItem[]): void;
  /** loading 持续时间超过 loadingTimeout 阈值时触发 */
  (
    e: 'loadingTimeout',
    payload: {
      video: CarouselVideoType.VideoItem | undefined;
      duration: number;
    },
  ): void;
}>();

/** video DOM 元素引用（v-show 模式下始终存在） */
const videoRef = ref<HTMLVideoElement | null>(null);
/** 当前实际播放的视频列表（已生效的列表，区别于 pendingVideos） */
const activeVideos = ref<CarouselVideoType.VideoItem[]>(cloneDeep(props.videos || []));
/** 待更新视频列表，在 immediateUpdate=false 时暂存新视频，等当前视频播放结束后消费 */
const pendingVideos = ref<CarouselVideoType.VideoItem[]>([]);
/** 当前播放索引，指向 activeVideos 中的位置 */
const currentIndex = ref<number>(0);
/** 加载状态，控制 Spin 遮罩显示 */
const loadingRef = ref<boolean>(false);
/** 视频事件映射，通过 v-on 绑定到 video 元素 */
const videoEventMap = ref<CarouselVideoType.VideoEventMap>({});

/**
 * 错误状态映射表，以 VideoItem.key 为键、number 为值，记录每个视频的错误次数
 * 错误次数 >= MAX_RETRY 时轮播跳过该视频；成功播放后重置为 0
 */
const errorMap = ref<Record<string, number>>({});

/** canplay 事件监听器缓存，用于在 replay 时等待视频就绪后触发播放 */
let canPlayHandler: (() => void) | null = null;

/** 当前 switchTo 的 action token，用于取消过期的 nextTick 异步操作 */
let currentActionToken = generateUUID();

/** loading 超时计时器 */
let loadingTimer: number | null = null;
/** loading 开始时间戳，用于计算实际等待时长 */
let loadingStartTime = 0;

/** 当前播放的视频项（手动维护，替代 computed，控制 v-show 和 src 绑定） */
const currentVideo = ref<CarouselVideoType.VideoItem | undefined>(undefined);
/** 封面覆盖层是否可见，替代 video 原生 poster 属性，避免切换时旧封面残留 */
const posterVisible = ref<boolean>(false);

/** 清除 loading 超时计时器 */
const clearLoadingTimer = () => {
  if (loadingTimer !== null) {
    clearTimeout(loadingTimer);
    loadingTimer = null;
  }
};

/**
 * 处理 video_url 为空的视频：标记错误并尝试切换到下一个
 * 避免 load() 空 src 触发 error 事件导致无限循环
 */
const handleEmptyUrl = () => {
  if (currentVideo.value) {
    const key = currentVideo.value.key;
    errorMap.value[key] = (errorMap.value[key] || 0) + 1;
  }
  if (isAllVideosError()) {
    if (!flushPendingIfNeeded()) {
      console.warn('[@@CarouselVideo.handleEmptyUrl] 所有视频加载失败');
    }
  } else {
    switchToNext();
  }
};

/**
 * 加载并播放当前视频
 * src 变化 / error / ended 时需调用 load() 重新加载（v-show 不重建 DOM，不会自动加载新 src）
 * @param prevSrc - 切换前的 video_url，用于判断 src 是否变化
 */
const loadAndPlay = (prevSrc?: string) => {
  const video = videoRef.value;
  if (!video) {
    return;
  }
  const currentUrl = currentVideo.value?.video_url;
  if (!currentUrl) {
    handleEmptyUrl();
    return;
  }
  const needLoad = Boolean(prevSrc !== currentUrl || video.error || video.ended);
  if (needLoad) {
    const currentKey = currentVideo.value?.key;
    video.load();
    if (currentVideo.value?.key !== currentKey) {
      return;
    }
  }
  replay(needLoad);
};

/**
 * 切换到指定索引的视频并播放
 * @param index - activeVideos 中的目标索引
 */
const switchTo = (index: number) => {
  if (index < 0 || index >= activeVideos.value.length) {
    return;
  }
  currentIndex.value = index;
  const prevSrc = currentVideo.value?.video_url;
  currentVideo.value = activeVideos.value[index];
  if (!currentVideo.value) {
    return;
  }
  posterVisible.value = true;
  // 生成本次 token，使之前未执行的 nextTick 回调失效
  const token = generateUUID();
  currentActionToken = token;
  // 等待 DOM 更新后操作 video 元素（v-show 模式下节点始终存在）
  nextTick(() => {
    if (token !== currentActionToken) {
      return;
    }
    loadAndPlay(prevSrc);
  });
};

/**
 * 跳转到指定 key 的视频并播放，找不到时回退到第一个
 * @param key - 目标视频的 key（string）
 */
const switchToKey = (key: string) => {
  const idx = activeVideos.value.findIndex(v => String(v.key) === key);
  if (idx === -1) {
    switchTo(0);
    return;
  }
  switchTo(idx);
};

/**
 * 切换到下一个视频，跳过错误次数 >= MAX_RETRY 的视频，到末尾后循环回第一个
 * 若所有视频都达到最大重试次数则不切换（由 error 事件的 isAllVideosError 分支处理）
 */
const switchToNext = () => {
  if (activeVideos.value.length === 0) {
    return;
  }
  const len = activeVideos.value.length;
  for (let i = 1; i <= len; i++) {
    const nextIdx = (currentIndex.value + i) % len;
    const key = activeVideos.value[nextIdx].key;
    const errorCount: number = errorMap.value[key] || 0;
    if (errorCount < MAX_RETRY) {
      switchTo(nextIdx);
      return;
    }
  }
};

/**
 * 判断当前 activeVideos 中的视频是否全部达到最大重试次数
 * @returns 空列表返回 false；否则仅当每个视频错误次数 >= MAX_RETRY 时返回 true
 */
const isAllVideosError = (): boolean => {
  if (activeVideos.value.length === 0) {
    return false;
  }
  return activeVideos.value.every(v => {
    const errorCount: number = errorMap.value[v.key] || 0;
    return errorCount >= MAX_RETRY;
  });
};

/**
 * 重置错误状态映射表
 */
const resetErrorMap = () => {
  errorMap.value = {};
};

/**
 * 消费待更新视频列表（pendingVideos），若有待更新则替换 activeVideos 并从头播放
 * @returns 是否有待更新被消费（true 表示已切换到新列表）
 */
const flushPendingIfNeeded = (): boolean => {
  if (pendingVideos.value.length === 0) {
    return false;
  }
  activeVideos.value = cloneDeep(pendingVideos.value);
  pendingVideos.value = [];
  resetErrorMap();
  switchTo(0);
  return true;
};

/**
 * 播放当前视频
 * @returns 是否成功开始播放（play() 返回 Promise 时根据 resolve/reject 判断；未返回 Promise 时默认 true）
 */
const play = async (): Promise<boolean> => {
  if (!videoRef.value || !currentVideo.value) {
    return false;
  }
  // 确保每次播放前同步 muted 和 playsInline 属性
  videoRef.value.muted = Boolean(props.muted);
  videoRef.value.playsInline = true;

  /** play() 在部分浏览器返回 Promise，需 catch 避免 Uncaught rejection */
  const playPromise = videoRef.value?.play?.();
  if (playPromise && typeof playPromise.catch === 'function') {
    return playPromise
      .then(() => true)
      .catch(() => {
        loadingRef.value = false;
        // 播放失败（如浏览器自动播放策略阻止），打印警告；不切换下一个以免无限循环
        console.warn('[CarouselVideo] 视频播放失败，可能被浏览器自动播放策略阻止');
        return false;
      });
  }
  return true;
};

/**
 * 暂停视频
 */
const pause = () => {
  videoRef.value?.pause?.();
};

/**
 * 清理 replay 注册的 canplay 监听器，避免重复绑定或残留回调
 */
const clearCanPlayHandler = () => {
  if (canPlayHandler && videoRef.value) {
    videoRef.value.removeEventListener('canplay', canPlayHandler);
    canPlayHandler = null;
  }
};

/**
 * 尝试将视频 seek 到开头
 * readyState === 0 时设置 currentTime 可能抛 InvalidStateError（Safari iOS），捕获后返回 false
 * @returns 是否 seek 成功
 */
const trySeekToStart = (): boolean => {
  const video = videoRef.value;
  if (!video) {
    return false;
  }
  try {
    video.currentTime = 0;
    return true;
  } catch {
    return false;
  }
};

/**
 * 注册一次性 canplay 监听器，视频就绪后 seek 到开头并播放
 * 用于视频未就绪（readyState < 3）或 load() 后 readyState 异步重置的场景
 * @param video - video DOM 元素
 * @param skipReadyCheck - true 时跳过 readyState 二次检查（afterLoad 场景，只信任 canplay 事件）
 */
const waitForCanPlayThenPlay = (video: HTMLVideoElement, skipReadyCheck = false) => {
  clearCanPlayHandler();
  let called = false;
  const handleCanPlay = () => {
    if (called) {
      return;
    }
    called = true;
    video.removeEventListener('canplay', handleCanPlay);
    canPlayHandler = null;
    try {
      video.currentTime = 0;
    } catch {
      // 忽略，canplay 后仍失败则从当前位置播放
    }
    play();
  };
  canPlayHandler = handleCanPlay;
  video.addEventListener('canplay', handleCanPlay, { once: true });
  // 二次检查防止 canplay 已在注册前触发导致永久等待；afterLoad 时只信任事件，跳过检查
  if (!skipReadyCheck && video.readyState >= CAN_PLAY_CODE) {
    handleCanPlay();
  }
};

/**
 * 重播当前视频：重置 currentTime 到开头并触发播放
 * 若视频尚未就绪（readyState < 3），则监听 canplay 事件后再播放
 * @param afterLoad - true 时跳过 readyState 快速路径，只信任 canplay 事件，避免 load() 后 readyState 异步重置竞态
 */
const replay = (afterLoad = false) => {
  const video = videoRef.value;
  if (!video) {
    return;
  }
  // afterLoad 时跳过快速路径，只信任 canplay 事件，避免 load() 后 readyState 异步重置竞态
  if (!afterLoad) {
    const seekSuccess = trySeekToStart();
    if (seekSuccess && video.readyState >= CAN_PLAY_CODE) {
      clearCanPlayHandler();
      play();
      return;
    }
  }
  waitForCanPlayThenPlay(video, afterLoad);
};

/**
 * 初始化视频事件映射，定义 loadstart / canplay / playing / ended / error 的处理逻辑
 * 最终赋值给 videoEventMap，通过 v-on 绑定到 video 元素
 */
const initVideoEventMap = () => {
  /** 开始加载时显示 loading 遮罩；currentVideo 为空时（清空场景）不设 loading，避免永久卡在 true */
  const loadstart = () => {
    if (!currentVideo.value) {
      return;
    }
    loadingRef.value = true;
  };

  /** canplay 事件：视频已就绪可播放，隐藏 loading */
  const canplay = () => {
    loadingRef.value = false;
    posterVisible.value = false;
  };

  /** playing 事件：视频开始播放，隐藏 loading 并重置当前视频的错误次数 */
  const playing = () => {
    loadingRef.value = false;
    posterVisible.value = false;
    if (currentVideo.value) {
      errorMap.value[currentVideo.value.key] = 0;
    }
  };

  /** ended 事件：当前视频播放结束，优先消费 pending 列表，否则切换到下一个视频（循环播放） */
  const ended = () => {
    if (flushPendingIfNeeded()) {
      return;
    }
    switchToNext();
  };

  /**
   * error 事件：当前视频加载失败，标记错误并尝试切换到下一个
   * 若所有视频都已失败，尝试消费 pending；无 pending 则打印警告
   */
  const error = () => {
    loadingRef.value = false;
    /** 清理 replay 注册的 canplay 监听器，避免视频加载失败后残留回调 */
    clearCanPlayHandler();
    /** 归因错误视频：用 dataset.key 匹配当前视频 */
    const dataKey = videoRef.value?.dataset.key;
    const failedItem = activeVideos.value.find(v => String(v.key) === dataKey);
    if (!failedItem) {
      // 归因失败说明该 error 来自已被替换的旧列表视频，不应干扰当前列表播放
      return;
    }
    const key = failedItem.key;
    const errorCount: number = errorMap.value[key] || 0;
    errorMap.value[key] = errorCount + 1;
    if (isAllVideosError()) {
      if (!flushPendingIfNeeded()) {
        console.warn('[@@CarouselVideo] 所有视频加载失败');
        emits('allVideosError', cloneDeep(activeVideos.value));
      }
      return;
    }
    switchToNext();
  };

  /** waiting 事件：视频缓冲中，显示 loading 遮罩 */
  const waiting = () => {
    loadingRef.value = true;
  };

  videoEventMap.value = {
    loadstart,
    canplay,
    playing,
    ended,
    error,
    waiting,
  };
};

/**
 * 清空所有播放状态并停止播放（videos 变为空数组时调用）
 */
const clearAllVideos = () => {
  // 取消 pending nextTick，避免清空后仍执行残留的 load()/replay()
  currentActionToken = generateUUID();
  // 清理 replay 注册的 canplay 监听器
  clearCanPlayHandler();
  pendingVideos.value = [];
  activeVideos.value = [];
  currentVideo.value = undefined;
  posterVisible.value = false;
  currentIndex.value = 0;
  resetErrorMap();
  pause();
  const video = videoRef.value;
  if (video) {
    video.removeAttribute('src');
    video.load();
  }
  loadingRef.value = false;
};

/**
 * 立即替换播放列表并从头播放（immediateUpdate=true 时调用）
 * @param newVideos - 新的视频列表
 */
const applyVideosImmediately = (newVideos: CarouselVideoType.VideoItem[]) => {
  pendingVideos.value = [];
  activeVideos.value = cloneDeep(newVideos);
  resetErrorMap();
  switchTo(0);
};

/**
 * 暂存新视频列表到 pending，等当前视频播放结束后消费（immediateUpdate=false 时调用）
 * 若当前无视频播放或所有视频都已失败，则主动消费避免死锁
 * @param newVideos - 新的视频列表
 */
const stagePendingVideos = (newVideos: CarouselVideoType.VideoItem[]) => {
  pendingVideos.value = cloneDeep(newVideos);
  if (activeVideos.value.length === 0 || isAllVideosError()) {
    flushPendingIfNeeded();
  }
};

/**
 * 组件挂载后初始化事件映射并自动播放第一个视频
 */
onMounted(() => {
  initVideoEventMap();
  if (activeVideos.value.length === 0) {
    return;
  }
  if (props.restoreHistory) {
    const saved = CarouselVideoManager.get();
    if (saved && CarouselVideoManager.matchVideosHash(props.videos)) {
      switchToKey(saved.key);
      return;
    }
  }
  switchTo(0);
});

/**
 * 组件卸载前清理 canplay 监听器，防止内存泄漏
 */
onBeforeUnmount(() => {
  if (props.restoreHistory && currentVideo.value) {
    CarouselVideoManager.set({
      key: String(currentVideo.value.key),
      videos: cloneDeep(activeVideos.value),
    });
  }
  currentActionToken = generateUUID();
  pause();
  clearCanPlayHandler();
  clearLoadingTimer();
});

/**
 * 监听 loadingRef 变化，集中管理超时计时器
 * - 进入 loading（true）时启动计时，超过 loadingTimeout 触发 loadingTimeout 事件
 * - 退出 loading（false）时清除计时器
 */
watch(loadingRef, isLoading => {
  if (isLoading) {
    loadingStartTime = Date.now();
    if (props.loadingTimeout > 0) {
      clearLoadingTimer();
      loadingTimer = window.setTimeout(() => {
        loadingTimer = null;
        emits('loadingTimeout', {
          video: currentVideo.value ? cloneDeep(currentVideo.value) : undefined,
          duration: Date.now() - loadingStartTime,
        });
      }, props.loadingTimeout);
    }
  } else {
    clearLoadingTimer();
  }
});

/**
 * 监听外部 videos 变化，根据 immediateUpdate 决定更新策略：
 * - 空数组：立即清空所有状态
 * - immediateUpdate=true：立即替换 activeVideos 并从头播放
 * - immediateUpdate=false：暂存到 pendingVideos，等当前视频 ended 后消费；
 *   若当前所有视频都已失败则主动消费，避免死锁
 */
watch(
  () => hashSum(props.videos),
  () => {
    const newVideos = props.videos;
    if (newVideos.length === 0) {
      clearAllVideos();
      return;
    }
    if (props.immediateUpdate) {
      applyVideosImmediately(newVideos);
      return;
    }
    stagePendingVideos(newVideos);
  },
);
</script>

<style scoped lang="scss">
.carousel-video {
  flex-shrink: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
  }

  .poster-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: top;
    background-repeat: no-repeat;
    pointer-events: none;
    z-index: 1;
  }
}
</style>
