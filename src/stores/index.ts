import { getUserInfoApi } from '@/apis/bilibili'
import { getMedalApi } from '@/apis/live'

export const useAppStore = defineStore(
  'app',
  () => {
    // 当前选中的用户
    const currentUser = ref<IUser>()

    // 所有登陆用户列表
    const userList = ref<IUser[]>([{
      mid: 0,
      uname: '',
      face: '',
      medals: [],
      medalCount: 0,
    }])

    // 当前的房间号
    const room = ref<number>()

    // 信息列表
    const msgList = ref<IMsg[]>([])

    // 置顶
    const isFix = ref(false)

    // 当前佩戴的粉丝勋章
    const currentMedal = ref<IUserMedal>()

    // 刷新当前用户信息
    async function refreshCurrentUser() {
      if (!currentUser.value)
        return

      const { data } = await getUserInfoApi()

      if (!data)
        return

      const { uname, face } = data
      currentUser.value.face = face
      currentUser.value.uname = uname

      // 更新用户列表
      const index = userList.value.findIndex(item => item.mid === currentUser.value?.mid)
      if (index !== -1)
        userList.value[index] = currentUser.value
    }

    // 获取当前用户的所有粉丝勋章
    async function getUserMedal() {
      if (!currentUser.value)
        return

      const list: IUserMedal[] = []
      const { data } = await getMedalApi(1)

      if (!data)
        return

      currentUser.value.medalCount = data.count

      list.push(...data.items)

      const { cur_page, total_page } = data.page_info
      // 循环获取所有勋章
      if (cur_page < total_page) {
        for (let i = cur_page + 1; i <= total_page; i++) {
          const { data } = await getMedalApi(i)
          if (!data)
            return

          list.push(...data.items)
        }
      }

      currentUser.value.medals = list

      // 更新当前选中的粉丝勋章
      const target = list.find(item => item.medal_id === currentMedal.value?.medal_id)

      if (target)
        currentMedal.value = target
    }

    return {
      currentUser,
      userList,
      room,
      msgList,
      isFix,
      currentMedal,
      refreshCurrentUser,
      getUserMedal,
    }
  },
  {
    persist: {
      paths: ['currentUser', 'userList', 'room', 'currentMedal'],
    },
  },
)