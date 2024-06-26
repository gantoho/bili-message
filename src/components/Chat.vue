<script lang="ts" setup>
import { dayjs } from 'element-plus'
import { nanoid } from 'nanoid'

import { sendMessageApi } from '@/apis/live'
import { EDMType } from '@/utils/enums'
import { connected, emojiList } from '@/utils/room'

const { currentUser, msgList, currentMedal, replyTo } = storeToRefs(useAppStore())

const emojiRef = ref()
const activeTab = ref('0')
const msg = ref('')
const inputRef = ref()
let isPrevent = false

const disabled = computed(() => !connected.value || !currentUser.value)
const placeholder = computed(() => {
  return replyTo.value ? `@ ${replyTo.value?.uname}（ESC取消）` : '发送一条弹幕吧~'
})

async function handleSend() {
  if (isPrevent) {
    isPrevent = false
    return
  }

  if (!msg.value.trim())
    return

  const replyUid = replyTo.value?.uid || 0

  const res = await sendMessageApi(msg.value.trim(), EDMType.普通弹幕, replyUid) as any
  if (!res)
    return

  // 含有屏蔽词, 添加到弹幕列表，但是划线显示
  if (res.msg === 'f' || res.message === 'f') {
    msgList.value.push({
      uid: currentUser.value?.mid || 0,
      id: nanoid(),
      type: 'message-banned',
      uname: currentUser.value?.uname || '',
      uface: currentUser.value?.face || '',
      message: msg.value,
      time: dayjs().format('HH:mm:ss'),
      medal: currentMedal.value,
    })
  }

  msg.value = ''
  replyTo.value = null
}

function handleSendEmoji(emoji: any) {
  const { emoticon_unique } = emoji
  // 文字表情
  if (emoticon_unique.startsWith('emoji_')) {
    msg.value += emoji.emoji
    return
  }

  sendMessageApi(emoticon_unique, EDMType.表情弹幕)
  emojiRef.value.hide()
}

/**
 * 判断图片长宽比，如果是长方形的 w 就返回长一点
 * 宽度 / 高度 在1.1以内，返回w-7
 * @param emoji
 */
function getEmojiWidth(emoji: any): string {
  // 1、判断是否为 emoji 表情
  if (emoji.width === 0 || emoji.height === 0)
    return 'w-7'

  // 2、如果是长方形直接return
  if (emoji.width / emoji.height >= 1.1)
    return 'w-22'

  // 3、说明是正方形且有宽高，是装扮表情
  return 'w-14'
}

function handleCompositionEnd() {
  isPrevent = true
  setTimeout(() => {
    isPrevent = false
  }, 100)
}

watch(replyTo, (newVal) => {
  if (newVal)
    inputRef.value.focus()
})
</script>

<template>
  <div class="chat">
    <el-popover ref="emojiRef" placement="top" trigger="click" :width="220">
      <template #reference>
        <el-button class="border-none! w-4" plain :disabled="disabled">
          <span class="i-carbon-face-activated-add h-6 w-6" />
        </el-button>
      </template>
      <el-tabs v-model="activeTab">
        <el-tab-pane v-for="tab in emojiList" :key="tab.pkg_id" class="h-30 overflow-y-scroll">
          <template #label>
            <div class="h-8 w-8 center">
              <img :src="tab.current_cover" :alt="tab.pkg_name">
            </div>
          </template>
          <div class="flex flex-wrap gap-3">
            <div
              v-for="emoji in tab.emoticons" :key="emoji.emoticon_id" class="min-h-6 center cursor-pointer"
              :class="getEmojiWidth(emoji)"
              @click="handleSendEmoji(emoji)"
            >
              <el-tooltip :content="emoji.emoji">
                <img :src="emoji.url" :alt="emoji.emoji">
              </el-tooltip>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-popover>
    <el-input
      ref="inputRef"
      v-model="msg"
      :placeholder="placeholder"
      class="flex-1" :disabled="disabled" :maxlength="20"
      show-word-limit clearable
      @compositionend="handleCompositionEnd"
      @keyup.enter="handleSend"
      @keyup.esc="replyTo = null"
    />
    <el-button type="primary" :disabled="disabled" class="w-3" @click="handleSend">
      <span class="i-carbon-send-alt h-5 w-5" />
    </el-button>
  </div>
</template>

<style lang="scss" scoped>
::-webkit-scrollbar {
  display: none;
}

.chat {
  @apply center gap-2 px-2 py-3 border-t border-gray-200;
}

:deep(.el-input-group__prepend){
  @apply px1
}
</style>
